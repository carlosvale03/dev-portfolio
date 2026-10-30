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
  database: (c, cx, cy, s) => {
    // The classic stacked-disk database: three bands, each with a status light.
    const rx = s * 0.34;
    const ry = s * 0.09;
    const top = cy - s * 0.32;
    const bottom = cy + s * 0.32;
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
    c.moveTo(cx - rx, top);
    c.lineTo(cx - rx, bottom);
    c.moveTo(cx + rx, top);
    c.lineTo(cx + rx, bottom);
    c.stroke();
    for (const t of [1 / 3, 2 / 3, 1]) {
      const y = top + (bottom - top) * t;
      c.beginPath();
      c.ellipse(cx, y, rx, ry, 0, 0, Math.PI);
      c.stroke();
      c.beginPath();
      c.arc(cx + rx * 0.62, y - (bottom - top) / 6 + ry * 0.35, s * 0.028, 0, Math.PI * 2);
      c.fill();
    }
  },
  network: (c, cx, cy, s) => {
    // A small feed-forward net: hollow nodes, with the connections stopping at
    // each node's edge so the layers stay readable.
    const layers = [3, 4, 2];
    const r = s * 0.065;
    const nodes = layers.map((n, i) =>
      Array.from({ length: n }, (_, j) => [cx + (i - 1) * s * 0.5, cy + (j - (n - 1) / 2) * s * 0.25] as const),
    );
    c.lineWidth = Math.max(3, s * 0.012);
    for (let i = 0; i < nodes.length - 1; i++)
      for (const a of nodes[i])
        for (const b of nodes[i + 1]) {
          const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const ux = (b[0] - a[0]) / d;
          const uy = (b[1] - a[1]) / d;
          c.beginPath();
          c.moveTo(a[0] + ux * r * 1.5, a[1] + uy * r * 1.5);
          c.lineTo(b[0] - ux * r * 1.5, b[1] - uy * r * 1.5);
          c.stroke();
        }
    c.lineWidth = s * 0.032;
    for (const layer of nodes)
      for (const [x, y] of layer) {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(x, y, r * 0.3, 0, Math.PI * 2);
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
