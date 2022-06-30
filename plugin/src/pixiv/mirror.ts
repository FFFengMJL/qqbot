import { formatInTimeZone } from "date-fns-tz";
import axios from "axios";
import {
  PixivicDate,
  PixivicListItem,
  PixivicMode,
  PixivicPage,
  PixivicPageSize,
  PixivicRankingParam,
  PixvicListResponse,
} from "./mirror.type";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 与镜像站的链接
 */
const pixivic = axios.create({
  headers: {
    referer: "https://pixivic.com/",
    origin: "https://pixivic.com",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  baseURL: "https://pix.ipv4.host/ranks",
});

/**
 * 与图片反代的链接，需要代理
 */
const pixivCat = axios.create({
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  headers: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  baseURL: "https://i.pixiv.cat",
  responseType: "arraybuffer",
});

/**
 * 从镜像站获取列表
 * @param {string} date 日期（一般来说日榜是前一天的），格式为 'yyyy-MM-dd'
 * @param {string} mode 榜单类型：日榜|周榜|月榜|男性向|女性向
 * @param {number} pageSize 一页的大小
 * @param {number} page 页数
 * @returns
 */
export async function getListFromPixivic({
  date,
  mode = "day",
  pageSize = 100,
  page = 1,
}: PixivicRankingParam) {
  console.log(
    `[PIXIV] getImageList\ndate: ${date}\nmode: ${mode}\npageSize: ${pageSize}\npage: ${page}`
  );

  const response = await pixivic.get(
    `?page=${page}&date=${date}&mode=${mode}&pageSize=${pageSize}`
  );

  return response.data as PixvicListResponse;
}

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 经过转换的 url，以 https://i.pixiv.cat 域名开头
 * @returns
 */
export async function getPixivImageToBase64(url: string) {
  const fileResponse = await pixivCat.get(url);
  if (fileResponse.status !== 200) {
    return null;
  }

  return `base64://${Buffer.from(fileResponse.data, "binary").toString(
    "base64"
  )}`;
}

/**
 * 根据图片列表随机获取一张图片
 * @param {Array<PixivicListItem>} imageList 在 pixivic.com 获取的列表
 * @returns
 */
export async function getARandomPixivImage(imageList: Array<PixivicListItem>) {
  const listLength = imageList.length;

  console.log(`[PIXIV] imageListLength: ${listLength}`);
  const index = Math.floor(Math.random() * listLength);

  const originUrl = imageList[index].imageUrls[0].original;
  // console.log(index, imageList[index]);
  const targetUrl = originUrl.replace("pximg.net", "pixiv.cat");

  return await getPixivImageToBase64(targetUrl);
}

export async function getRandomImageWithPixivic(
  date: PixivicDate = formatInTimeZone(
    subDays(new Date(), 1),
    "America/Araguaina",
    "yyyy-MM-dd"
  ),
  mode: PixivicMode = "day",
  pageSize: PixivicPageSize = 100,
  page: PixivicPage = 1
) {
  console.log(
    `${format(new Date(), "[yyyy-MM-dd HH:mm:ss]", {
      locale: zhCN,
    })} [PIXIV] start`
  );

  const imageList = await getListFromPixivic({
    date,
    mode,
    pageSize,
    page,
  });

  let base64Image: string | null = null;
  if (imageList.data !== undefined) {
    base64Image = await getARandomPixivImage(imageList.data);
  } else {
    console.log(`[PIXIV] not get image list`);
  }

  console.log(
    `${format(new Date(), "[yyyy-MM-dd HH:mm:ss]", {
      locale: zhCN,
    })} [PIXIV] end`
  );
  return base64Image;
}
