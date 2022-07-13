import { IllustContentType } from "pixiv/pixiv.type";

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
];

export const TYPE_FILTER: Partial<IllustContentType> = {
  grotesque: false,
  violent: false,
  drug: false,
  antisocial: false,
  bl: false,
  furry: false,
};

export const ILLUST_TYPE_FILETER = ["1"];
