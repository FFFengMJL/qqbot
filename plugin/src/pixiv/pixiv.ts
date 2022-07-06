import {
  PixivArtworksContent,
  PixivArtworksIllust,
  PixivImage,
  PixivNormalRankingMode,
  PixivRankingImageItem,
  PixivRankingReponse,
  TAG_EXCLUDE_FILTER,
  TYPE_FILTER,
} from "./pixiv.type";
import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { get as ObjectGet } from "lodash";
import { getPixivImageToBase64FromPixivCat } from "./pixivCat";

/**
 * 用于与 pixiv.net 进行请求
 */
const PixivClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
    Referer: "https://www.pixiv.net",
  },
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  timeout: 20000,
  baseURL: "https://www.pixiv.net",
});

/**
 * 获取 https://www.pixiv.net/ranking.php 的 html 代码
 * @returns
 */
export async function getRankingStringFromPixivWithHtml() {
  try {
    const response = await PixivClient.get("/ranking.php");
    if (response.status !== 200) return null;

    return response.data as string;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * 检查是否是漫画类别
 * @param items <div class="ranking-image-item"> 节点
 * @param index 索引
 * @returns true/false
 */
function checkIsMangeFromCheerio(items: cheerio.Cheerio, index: number) {
  const item = items.eq(index).find('div[class="ranking-image-item"]');
  const imgTags = item.find("img").attr("data-tags")?.split(" ");
  return item.find("a").hasClass("manga") || !!imgTags?.includes("漫画");
}

/**
 * 通过 html 代码获取随机的图片
 * @returns
 */
export async function getRandomImageWithPixivByHtml() {
  const responseString = await getRankingStringFromPixivWithHtml();

  if (!responseString) {
    return null;
  }

  const items = cheerio.load(responseString)('section[class="ranking-item"]'); // 获取列表
  const itemsWithoutMange = items.filter(
    (index) => !checkIsMangeFromCheerio(items, index)
  ); // 筛选，过滤掉漫画

  const index = Math.floor(Math.random() * itemsWithoutMange.length);
  const targetItem = itemsWithoutMange.eq(index); // 随机出来的图片节点
  const artist = targetItem.attr("data-user-name"); // 作者
  const title = targetItem.attr("data-title"); // 作品名
  const artworkId = targetItem.attr("data-id"); // 作品 ID
  const src = targetItem
    .find("img")
    .attr("data-src")
    ?.replace("i.pximg.net/c/240x480/img-master", "i.pximg.net/img-original")
    .replace("_master1200", ""); // 作品链接（这个获取获取方式是错的）

  if (!artist || !title || !artworkId || !src) {
    console.log(artist, title, artworkId, src);
    return null;
  }

  const link = `https://www.pixiv.net/artworks/${artworkId}`;

  const base64 = await getPixivImageToBase64FromPixivCat(src);

  return {
    artist,
    link,
    base64,
    title,
  } as PixivImage;
}

/**
 * 使用 pixiv.net 的 api 获取对应的列表
 * @param mode 榜单类型，默认日榜
 * @param page 页码，默认第一页，取值[1, 10]
 * @param date 日期（可选）
 */
export async function getRankingListFromPixiv(
  mode: PixivNormalRankingMode = "daily",
  page: number = 1,
  date?: string
) {
  try {
    console.log(`[PIXIV] mode[${mode}] page[${page}]${date ? ` ${date}` : ""}`);
    const response = await PixivClient.get(`/ranking.php`, {
      params: {
        mode,
        p: page,
        date,
        format: "json",
      },
    }); // 获取响应

    // const response = await PixivClient.get(
    //   `/ranking.php?mode=${mode}&p=${page}${date ? `&${date}` : ""}&format=json`
    // ); // 获取响应

    if (response.status !== 200) {
      return null;
    }

    return response.data as PixivRankingReponse;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * 根据 pixiv.net/artworks/xxxx 获取对应的 html 代码
 * @param illustId 作品 id
 * @returns
 */
export async function getImageDetailUrl(illustId: number) {
  try {
    console.log(`[PIXIV] [GET] /artworks/${illustId}`);
    const response = await PixivClient.get(`/artworks/${illustId}`);
    console.log(`[PIXIV] [GET] [${response.status}]`);

    if (response.status !== 200) {
      return null;
    }

    return response.data as string;
  } catch (error: any) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
      // 而在node.js中是 http.ClientRequest 的实例
      console.log(error.request);
    } else {
      // 发送请求时出了点问题
      console.log("Error", error.message);
    }
    console.log(error.config);
    return undefined;
  }
}

/**
 * 根据获得的 html 代码进行解析，获取  <meta name="preload-data" id="meta-preload-data"> 中的数据
 * @param html html 字符串
 * @returns
 */
export function parseArtworkContentToJSON(html: string) {
  const content = cheerio
    .load(html)('meta[name="preload-data"][id="meta-preload-data"]')
    .attr("content");

  if (content === undefined) {
    return content;
  }

  try {
    return JSON.parse(content) as PixivArtworksContent;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * 随机从 pixiv.net 的榜单中获取一张图片
 * @param mode 榜单类型
 * @param maxPage 页码随机的最大值
 * @param date 日期（可选）
 */
export async function getRandomImageWithPixiv(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10,
  date?: string
) {
  // 获取一页列表
  const randomPage = Math.floor(Math.random() * maxPage + 1); // 随机生成页码
  const rankingResponse = await getRankingListFromPixiv(mode, randomPage, date); // 获取响应

  if (!rankingResponse) {
    return rankingResponse;
  }
  // console.log(randomPage);
  // console.log(rankingResponse.contents);

  const imageList = rankingResponse.contents;

  // 筛选图片列表
  const filteredImageList = filterImageList(imageList);
  console.log(
    `[PIXIV] imageListLength[${imageList.length}] filteredImageListLength[${filteredImageList.length}]`
  );

  // 随机选取图片
  const randomImageIndex = Math.floor(Math.random() * filteredImageList.length); // 随机选取图片
  const targetImageItem = filteredImageList[randomImageIndex];
  const artworkUrl = `https://pixiv.net/artworks/${targetImageItem.illust_id}`;
  console.log(
    `[PIXIV] randomIndex[${randomImageIndex}] artworkUrl[${artworkUrl}]`
  );

  // 获取原图 url
  const artworkHtml = await getImageDetailUrl(targetImageItem.illust_id); // 获取网页
  if (!artworkHtml) {
    return null;
  }
  const artworkContent = await parseArtworkContentToJSON(artworkHtml); // 解析网页内容获取 JSON 对象
  if (!artworkContent) {
    return artworkContent;
  }

  // 获取图片 url
  const artworkIllustUrls = ObjectGet(
    artworkContent.illust,
    targetImageItem.illust_id
  ) as PixivArtworksIllust;
  const imageSrc = artworkIllustUrls.urls.original;
  let base64 = await getPixivImageToBase64(imageSrc);

  if (!base64) {
    base64 = await getPixivImageToBase64FromPixivCat(imageSrc);
  }

  return {
    title: targetImageItem.title,
    artist: targetImageItem.user_name,
    link: artworkUrl,
    base64,
  } as PixivImage;
}

/**
 * 筛选列表
 * @param imageList 图片列表
 * @returns
 */
export function filterImageList(imageList: Array<PixivRankingImageItem>) {
  return imageList.filter((item) => {
    const tagCheck = !item.tags.some((tag) => TAG_EXCLUDE_FILTER.includes(tag)); // 不含有对应的 tag
    const typeCheck = Object.keys(TYPE_FILTER).every((_) => {
      const type = _ as keyof typeof TYPE_FILTER;
      return TYPE_FILTER[type] === item.illust_content_type[type];
    }); // 符合 type 的要求

    // console.log(tagCheck, typeCheck);
    return tagCheck && typeCheck;
  });
}

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 图片的 url，以 https://i.pximg.net 域名开头
 * @returns
 */
export async function getPixivImageToBase64(url: string) {
  try {
    console.log(`[PIXIV] url: ${url}`);
    const fileResponse = await PixivClient.get(url, {
      responseType: "arraybuffer",
    });
    console.log(
      `[PIXIV] i.pximg.net response: ${fileResponse.status} ${fileResponse.data.length}`
    );
    if (fileResponse.status !== 200) {
      return undefined;
    }

    return `base64://${Buffer.from(fileResponse.data, "binary").toString(
      "base64"
    )}`;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
