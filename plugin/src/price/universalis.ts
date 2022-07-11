import axios from "axios";

const _Worlds = [
  {
    name: "陆行鸟",
    nickname: "狗",
    worlds: [
      "红玉海",
      "神意之地",
      "拉诺西亚",
      "幻影群岛",
      "萌芽池",
      "宇宙和音",
      "沃仙曦染",
      "晨曦王座",
    ],
  },
  {
    name: "莫古力",
    nickname: "狗",
    worlds: [
      "白银乡",
      "白金幻象",
      "神拳痕",
      "潮风亭",
      "旅人栈桥",
      "拂晓之间",
      "龙巢神殿",
      "梦羽宝境",
    ],
  },
  {
    name: "猫小胖",
    nickname: "狗",
    worlds: [
      "紫水栈桥",
      "延夏",
      "静语庄园",
      "摩杜纳",
      "海猫茶屋",
      "柔风海湾",
      "琥珀原",
    ],
  },
  {
    name: "豆豆柴",
    nickname: "狗",
    worlds: ["水晶塔", "银泪湖", "太阳海岸", "伊修加德"],
  },
] as const;

export type DC = typeof _Worlds[number]["name"];
export type WorldOrDC = typeof _Worlds[number]["worlds"][number] | DC;

/**
 * 判断字符串是否是服务器/大区
 * @param str 字符串
 * @returns
 */
export function isWorldOrDC(str: String) {
  return _Worlds.some((dc) => {
    return dc.name === str || dc.worlds.some((world) => world === str);
  });
}

interface Shown {
  lastReviewTime: Number; // 上次看到的时间戳
  pricePerUnit: Number; // 单价
  quantity: Number; // 数量
  stainID: Number;
  worldName?: WorldOrDC; // 服务器名字
  worldID?: Number; // 服务器 ID
  creatorName: String; // 制作者昵称
  creatorID: String | null; // 制作者 ID
  hq: Boolean; // 是否是 HQ
  isCrafted: Boolean; // 是否是制作的
  listingID: Number | null;
  materia: Array<any>;
  onMannequin: Boolean;
  retainerCity: Number; // 雇员所在城市
  retainerID: String; // 雇员 ID
  retainerName: String; // 雇员昵称
  sellerID: String; // 出售者 ID
  total: Number; // 总价
}

interface Sold {
  hq: Boolean; // 是否是 HQ
  pricePerUnit: Number; // 单价
  quantity: Number; // 数量
  timestamp: Number; // 时间戳
  worldName?: WorldOrDC; // 服务器名称
  worldID?: Number; // 服务器 ID
  buyerName: String; // 购买者昵称
  total: Number; // 总价
}

interface CurrentlyShownResponse {
  itemID: Number;
  worldID?: Number;
  worldName?: WorldOrDC;
  dcNmae?: DC;
  lastUploadTime: Date;
  listings: Array<Shown>;
  recentHistory: Array<Sold>;
  currentAveragePrice: Number;
  currentAveragePriceNQ: Number;
  currentAveragePriceHQ: Number;
  regularSaleVelocity: Number;
  nqSaleVelocity: Number;
  hqSaleVelocity: Number;
  averagePrice: Number;
  averagePriceNQ: Number;
  averagePriceHQ: Number;
  minPrice: Number;
  minPriceNQ: Number;
  minPriceHQ: Number;
  maxPrice: Number;
  maxPriceNQ: Number;
  maxPriceHQ: Number;
  stackSizeHistogram: Object;
  stackSizeHistogramNQ: Object;
  stackSizeHistogramHQ: Object;
  worldUploadTimes: Object;
}

const UniversalisURL = "https://universalis.app";

export async function getCurrentlyShownById(
  itemId: Number,
  worldOrDc: WorldOrDC = "猫小胖",
  listings: Number = 5
) {
  const requestURL = `${UniversalisURL}/api/${encodeURI(
    worldOrDc
  )}/${itemId}?listings=${listings}`;

  const response = await axios.get(requestURL, {
    proxy: {
      host: "127.0.0.1",
      port: 7890,
    },
  });

  return response.data as CurrentlyShownResponse;
}
