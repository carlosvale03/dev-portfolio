// Drawing recipes the particles settle into. Each one paints a solid silhouette
// (black on transparent) that ParticleField samples into target points.
export type Draw = (c: CanvasRenderingContext2D, cx: number, cy: number, s: number, font: string) => void;

const pentagon = (c: CanvasRenderingContext2D, px: number, py: number, pr: number, rot = -Math.PI / 2) => {
  c.beginPath();
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + rot;
    c.lineTo(px + Math.cos(a) * pr, py + Math.sin(a) * pr);
  }
  c.fill();
};

const star = (c: CanvasRenderingContext2D, px: number, py: number, outer: number, inner: number, points = 5) => {
  c.beginPath();
  for (let k = 0; k < points * 2; k++) {
    const r = k % 2 ? inner : outer;
    const a = (k / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    c.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
  }
  c.fill();
};

const text = (label: string, scale: number): Draw => (c, cx, cy, s, font) => {
  c.font = `900 ${s * scale}px ${font}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(label, cx, cy + s * 0.04);
};

export const SHAPES = {
  cv: text("CV", 0.66),
  code: text("</>", 0.5),
  scatter: (c, cx, cy, s) => {
    // A noisy cloud of raw data points.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 150; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * s * 0.55;
      c.beginPath();
      c.arc(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 0.8, s * 0.018 + rand() * s * 0.02, 0, Math.PI * 2);
      c.fill();
    }
  },
  network: (c, cx, cy, s) => {
    const layers = [3, 5, 5, 2];
    const nodes = layers.map((n, i) =>
      Array.from({ length: n }, (_, j) => [cx - s * 0.45 + (i * s * 0.9) / 3, cy + (j - (n - 1) / 2) * s * 0.19] as const),
    );
    c.lineWidth = Math.max(2, s * 0.014);
    for (let i = 0; i < nodes.length - 1; i++)
      for (const a of nodes[i])
        for (const b of nodes[i + 1]) {
          c.beginPath();
          c.moveTo(a[0], a[1]);
          c.lineTo(b[0], b[1]);
          c.stroke();
        }
    for (const layer of nodes)
      for (const [x, y] of layer) {
        c.beginPath();
        c.arc(x, y, s * 0.045, 0, Math.PI * 2);
        c.fill();
      }
  },
  chart: (c, cx, cy, s) => {
    const bars = [0.35, 0.55, 0.42, 0.78, 0.62, 0.95];
    const w = s * 0.11;
    const base = cy + s * 0.38;
    bars.forEach((h, i) => c.fillRect(cx - s * 0.48 + i * w * 1.55, base - h * s * 0.7, w, h * s * 0.7));
    c.fillRect(cx - s * 0.52, base + s * 0.02, s * 1.04, s * 0.025);
  },
  ball: (c, cx, cy, s) => {
    const r = s * 0.42;
    c.lineWidth = s * 0.035;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    pentagon(c, cx, cy, r * 0.32);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      pentagon(c, cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, r * 0.2);
    }
  },
  gamepad: (c, cx, cy, s) => {
    const w = s * 0.95;
    const h = s * 0.5;
    const l = cx - w / 2;
    const t = cy - h / 2;
    c.beginPath();
    c.roundRect(l, t, w, h, h / 2);
    c.fill();
    c.globalCompositeOperation = "destination-out";
    const u = h * 0.13;
    c.fillRect(l + w * 0.24 - u * 1.6, cy - u / 2, u * 3.2, u);
    c.fillRect(l + w * 0.24 - u / 2, cy - u * 1.6, u, u * 3.2);
    for (const [px, py] of [
      [0.72, -0.13],
      [0.82, 0.1],
      [0.62, 0.1],
      [0.72, 0.32],
    ]) {
      c.beginPath();
      c.arc(l + w * px, cy + h * py * 0.9, u * 0.62, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  },
  // Anime nods, drawn as generic silhouettes: a four-star orb, a ninja star
  // and a straw hat.
  orb: (c, cx, cy, s) => {
    const r = s * 0.44;
    c.lineWidth = s * 0.045;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    const pts: [number, number][] = [
      [-0.38, -0.3],
      [0.36, -0.26],
      [-0.2, 0.36],
      [0.4, 0.34],
    ];
    for (const [px, py] of pts) star(c, cx + px * r, cy + py * r, r * 0.26, r * 0.11);
  },
  shuriken: (c, cx, cy, s) => {
    const r = s * 0.46;
    c.save();
    c.translate(cx, cy);
    c.rotate(Math.PI / 8);
    star(c, 0, 0, r, r * 0.22, 4);
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.globalCompositeOperation = "source-over";
  },
  hat: (c, cx, cy, s) => {
    c.beginPath();
    c.ellipse(cx, cy + s * 0.1, s * 0.52, s * 0.14, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(cx, cy - s * 0.04, s * 0.26, s * 0.24, 0, Math.PI, 0);
    c.lineTo(cx + s * 0.26, cy + s * 0.1);
    c.lineTo(cx - s * 0.26, cy + s * 0.1);
    c.fill();
    c.globalCompositeOperation = "destination-out";
    c.fillRect(cx - s * 0.27, cy - s * 0.02, s * 0.54, s * 0.06);
    c.globalCompositeOperation = "source-over";
  },
} satisfies Record<string, Draw>;

export type ShapeId = keyof typeof SHAPES;
