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
} from "./pixivic.type";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getPixivImageToBase64FromPixivCat } from "./pixivCat";

/**
 * 与镜像站的链接
 */
const pixivic = axios.create({
  headers: {
    referer: "https://pixivic.com",
    origin: "https://pixivic.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  baseURL: "https://pix.ipv4.host/ranks",
  timeout: 20000,
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
    `[PIXIV] getImageList\n\tdate: ${date}\n\tmode: ${mode}\n\tpageSize: ${pageSize}\n\tpage: ${page}`
  );

  const response = await pixivic.get(``, {
    params: {
      page,
      date,
      mode,
      pageSize,
    },
  });

  return response.data as PixvicListResponse;
}

/**
 * 根据图片列表随机获取一张图片
 * @param {Array<PixivicListItem>} imageList 在 pixivic.com 获取的列表
 * @returns
 */
export async function getRandomPixivicImage(imageList: Array<PixivicListItem>) {
  try {
    const listLength = imageList.length;

    console.log(`[PIXIV] imageListLength: ${listLength}`);
    let index = Math.floor(Math.random() * listLength);
    console.log(`[PIXIV] index: ${index} id: ${imageList[index].id}`);

    while (
      imageList[index].tags.findIndex((tag) => tag.name == "漫画") !== -1
    ) {
      imageList = imageList.splice(index, 1);
      index = Math.floor(Math.random() * listLength);
      console.log(`[PIXIV] index: ${index} id: ${imageList[index].id}`);
    }

    const originUrl = imageList[index].imageUrls[0].original;
    // console.log(index, imageList[index]);

    return await getPixivImageToBase64FromPixivCat(originUrl);
  } catch (error) {
    console.log(error);
    return;
  }
}

export async function getRandomImageWithPixivic(
  date: PixivicDate = formatInTimeZone(
    subDays(new Date(), 2),
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

  let imageListResponse = await getListFromPixivic({
    date,
    mode,
    pageSize,
    page,
  });

  // console.log(
  //   `${imageListResponse.message}`,
  //   `${imageListResponse.data?.length}`
  // );

  let tempImageList = imageListResponse.data?.filter(
    (item) => item !== undefined
  );

  if (!tempImageList || tempImageList.length === 0) {
    console.log(`[PIXIV] get image list error`);
    return undefined;
  }

  let base64Image: string | undefined = undefined;
  base64Image = await getRandomPixivicImage(tempImageList);

  console.log(
    `${format(new Date(), "[yyyy-MM-dd HH:mm:ss]", {
      locale: zhCN,
    })} [PIXIV] end`
  );
  return base64Image;
}
