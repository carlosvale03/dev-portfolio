// Anime stickers (chibi and pixel art) hosted on GIPHY as transparent animated WebP.
// hotlinked from GIPHY's CDN with attribution, never stored in the repo.
export interface Sticker {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Small pixel-art sprites are upscaled without smoothing. */
  pixel?: boolean;
}

export const giphySrc = (id: string) => `https://media.giphy.com/media/${id}/giphy.webp`;
export const giphyPage = (id: string) => `https://giphy.com/stickers/${id}`;

export const ANIME = {
  db: {
    color: "#f28c18",
    ink: "#121212",
    stickers: [
      { id: "byWOYFMPwqVfG", name: "Goku (Super Saiyajin)", width: 77, height: 98, pixel: true },
      { id: "3o7btLTDQ9ImryBzCE", name: "Goku", width: 480, height: 480 },
      { id: "9VYEBjVz79dy8", name: "Gohan (Super Saiyajin)", width: 104, height: 142, pixel: true },
      { id: "yyMAeYCoBpqbPQmeJZ", name: "Goku", width: 391, height: 507 },
    ],
  },
  naruto: {
    color: "#1f2a44",
    ink: "#f4f2ec",
    stickers: [
      { id: "jDWQL2uPrBNn2", name: "Naruto (Kyuubi)", width: 200, height: 200, pixel: true },
      { id: "Eu1mxOumac5gc", name: "Naruto", width: 200, height: 200, pixel: true },
      { id: "shpIYfSrJ5d9wqrumG", name: "Sharingan", width: 500, height: 500 },
      { id: "Yqn8vIvs2DHk04tu5J", name: "Naruto", width: 480, height: 384 },
    ],
  },
  op: {
    color: "#c81d25",
    ink: "#f4f2ec",
    stickers: [
      { id: "hD47OUZSuGgwALbPcv", name: "Luffy", width: 200, height: 200 },
      { id: "Tgvn82bqJT36lkVqDZ", name: "Luffy (Gear 5)", width: 480, height: 480 },
      { id: "cVrccUf0NC1TQlLiZf", name: "Zoro", width: 480, height: 480 },
      { id: "n5bEszMAXLVX1BFH0P", name: "Franky", width: 238, height: 480 },
    ],
  },
} satisfies Record<string, { color: string; ink: string; stickers: Sticker[] }>;

/** Goku on the flying nimbus, used for the cameo that crosses the screen. */
export const NIMBUS: Sticker = { id: "SaSAUwiGPsPtswfPRk", name: "Goku", width: 356, height: 600 };
