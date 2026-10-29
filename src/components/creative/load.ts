// Shared loader so hovering the mode switch can warm up the same chunk that
// next/dynamic renders later.
export const loadCreative = () => import("./CreativeMain");
