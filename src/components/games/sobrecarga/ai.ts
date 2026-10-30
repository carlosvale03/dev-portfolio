import { NO_INTENT, type Fighter, type Host, type Intent } from "./fighter";
import { moveOf, type MoveId } from "./moves";

// Enemy brains. Only the enemies holding an attack token press forward; the
// rest circle at a distance and wait their turn, so a crowd stays readable.
// Every enemy reacts to the player's attacks after its own reaction delay.

const REACH: Partial<Record<MoveId, number>> = {
  jab: 78, cross: 80, hook: 82, uppercut: 70, frontKick: 96, roundhouse: 100, spinKick: 104,
  sweep: 98, grab: 62, haymaker: 100, stomp: 190, airKick: 230, throwOrb: 520,
};

/** Input that makes Fighter.tryAttack pick this move. */
function pressFor(id: MoveId): Partial<Intent> {
  switch (id) {
    case "uppercut":
      return { up: true, punch: true };
    case "flipKick":
      return { up: true, kick: true };
    case "sweep":
      return { down: true, kick: true };
    case "grab":
      return { grab: true };
    case "frontKick":
    case "roundhouse":
    case "spinKick":
      return { kick: true };
    default:
      return { punch: true };
  }
}

const DIRECT: MoveId[] = ["haymaker", "stomp", "throwOrb", "roundhouse", "spinKick", "hook", "cross"];

export function think(f: Fighter, foe: Fighter | null, host: Host, rand: () => number): Intent {
  const a = f.arch!;
  const b = f.brain;
  const now = host.now;
  if (f.state === "held") return rand() < 0.012 ? { ...NO_INTENT, punch: true } : NO_INTENT;
  if (!f.alive || f.state === "rag" || f.state === "getup" || f.state === "hit" || f.state === "dead") return NO_INTENT;
  if (!foe || !foe.alive) return NO_INTENT;

  const enraged = f.kind === "legacy" && f.hp < f.maxHp * 0.5;
  const reaction = a.reaction * (enraged ? 0.7 : 1);
  const aggression = Math.min(0.95, a.aggression + (enraged ? 0.18 : 0));
  const dx = foe.x - f.x;
  const dist = Math.abs(dx);
  const dir = Math.sign(dx) || 1;
  const reach = (id: MoveId) => (REACH[id] ?? 90) * f.scale;

  // Keep a chain going while it lands.
  if (f.state === "attack" && f.move) {
    const m = moveOf(f.move);
    if (b.chainLeft > 0 && m.cancel && f.moveT >= m.cancel) {
      b.chainLeft--;
      return { ...NO_INTENT, ...(rand() < 0.5 ? { punch: true } : { kick: true }) };
    }
    return NO_INTENT;
  }
  if (f.state === "grab") return f.holdT > 500 ? { ...NO_INTENT, kick: rand() < 0.5, punch: rand() >= 0.5, dx: rand() < 0.4 ? -f.facing : 0 } : NO_INTENT;

  // React to the player's attack: guard or roll away, after the reaction delay.
  if (foe.state === "attack" && foe.move && dist < 170 * f.scale && Math.sign(f.x - foe.x) === foe.facing) {
    const key = `${foe.id}:${foe.move}:${Math.floor(foe.t / 1000)}`;
    if (b.plan !== `seen:${key}` && foe.moveT > reaction * 0.35) {
      b.plan = `seen:${key}`;
      const r = rand();
      if (r < a.block) {
        b.next = now + 420;
        return { ...NO_INTENT, block: true };
      }
      if (r < a.block + a.roll) {
        f.roll(-dir, host);
        return NO_INTENT;
      }
    }
  }
  if (f.state === "block") return now < b.next ? { ...NO_INTENT, block: true } : NO_INTENT;

  // Ranged enemies keep away and throw.
  if (a.ranged && (!b.token || dist > 160)) {
    if (dist < 280) return { ...NO_INTENT, dx: dist < 160 ? -dir * 2 : -dir };
    if (dist > 560) return { ...NO_INTENT, dx: dir };
    if (now > b.next) {
      b.next = now + 1400 + rand() * 900;
      f.facing = dir;
      f.startMove("throwOrb", host);
    }
    return NO_INTENT;
  }

  if (!b.token) {
    // Circle at a distance, sometimes taunt.
    const want = 240 + (f.id % 3) * 50;
    if (now > b.next) {
      b.next = now + 700 + rand() * 900;
      b.strafe = rand() < 0.5 ? -1 : 1;
    }
    if (dist > want + 60) return { ...NO_INTENT, dx: dir };
    if (dist < want - 60) return { ...NO_INTENT, dx: -dir };
    return { ...NO_INTENT, dx: rand() < 0.02 ? b.strafe : 0 };
  }

  // Aggressor: low on health, it sometimes backs off for a breath.
  if (f.hp < f.maxHp * 0.25 && rand() < 0.004) b.next = now + 600;
  if (now < b.next && b.plan === "retreat") return { ...NO_INTENT, dx: -dir };

  if (!b.wantMove) {
    const pool = a.moves.filter((m) => m !== "throwOrb" || a.ranged || f.kind === "legacy");
    b.wantMove = pool[Math.floor(rand() * pool.length)];
  }
  const want = b.wantMove!;
  if (want === "airKick") {
    if (dist > 200 && dist < 280 && f.grounded) return { ...NO_INTENT, jump: true, dx: dir };
  }
  if (!f.grounded) {
    if (dist < reach("airKick") * 0.5) {
      b.wantMove = null;
      return { ...NO_INTENT, kick: true, dx: dir };
    }
    return { ...NO_INTENT, dx: dir };
  }

  // Far away it runs in (dx beyond 1 means run), so the fight keeps its pace.
  if (dist > reach(want)) return { ...NO_INTENT, dx: dist > 320 ? dir * 2 : dir };
  if (now < b.next) return NO_INTENT;
  // In range: attack now, or wait a beat (less aggressive types wait longer).
  // Rolled every step: two thirds of the original rate keeps them pressing hard.
  if (rand() > aggression * 0.08) return { ...NO_INTENT, dx: dist < reach(want) * 0.5 ? -dir : 0 };
  b.next = now + reaction * (0.8 + rand());
  b.wantMove = null;
  b.chainLeft = Math.floor(rand() * a.combo);
  f.facing = dir;
  if (DIRECT.includes(want) && (want === "haymaker" || want === "stomp" || want === "throwOrb")) {
    f.startMove(want, host);
    return NO_INTENT;
  }
  return { ...NO_INTENT, ...pressFor(want) };
}
