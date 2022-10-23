import { IllustContentType } from "./pixiv/pixiv.type";

export const TAG_EXCLUDE_FILTER = new Set([
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
  "女装",
  "男の娘",
  "おにショタ",
  "四コマ",
  "むちむち",
  "ぽっちゃり",
  "女装男子",
  "雄っぱい",
]);

export const TYPE_FILTER: Partial<IllustContentType> = {
  grotesque: false,
  violent: false,
  drug: false,
  antisocial: false,
  bl: false,
  furry: false,
};

export const ILLUST_TYPE_FILTER = new Set(["1"]);

export const ILLUSTOR_FILTER = new Set([
  "36762442",
  "908878",
  "12613821",
  "889193",
  "14185",
  "30998669",
  "3881581",
  "15166869",
  "52621604",
  "6219028",
  "85014735",
  "11105958",
  "29389147",
  "63861743",
  "8414069",
  "37676420",
  "59895101",
  "718191",
]);
