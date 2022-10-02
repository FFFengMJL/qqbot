import { IllustContentType } from "./pixiv/pixiv.type";

export const TAG_EXCLUDE_FILTER = [
  "漫画",
  "創作BL",
  "BL",
  "男の子",
  "筋肉娘",
  "メスケモ",
  "ケモノ",
  "4コマ",
  "ケモナー",
  "4コマ漫画",
  "188男团",
];

export const TYPE_FILTER: Partial<IllustContentType> = {
  grotesque: false,
  violent: false,
  drug: false,
  antisocial: false,
  bl: false,
  furry: false,
};

export const ILLUST_TYPE_FILTER = ["1"];

export const ILLUSTOR_FILTER = ["36762442", "908878", "12613821"];
