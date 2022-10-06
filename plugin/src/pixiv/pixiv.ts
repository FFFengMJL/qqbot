import { subDays } from "date-fns";
import { format, utcToZonedTime } from "date-fns-tz";
import {
  PixivArtworksContent,
  PixivArtworksIllust,
  PixivArtworksIllustBasic,
  PixivImage,
  PixivNormalRankingMode,
  PixivRankingImageItem,
  PixivRankingReponse,
} from "./pixiv.type";
import axios from "axios";
import * as cheerio from "cheerio";
import { get as ObjectGet } from "lodash";
import { getPixivImageToBase64FromPixivCat } from "./pixivRE/pixivCat";
import { PixivRankingImage, PrismaClient } from "@prisma/client";
import { logError } from "../utils/error";
import {
  ILLUSTOR_FILTER,
  ILLUST_TYPE_FILTER,
  TAG_EXCLUDE_FILTER,
  TYPE_FILTER,
} from "../pixiv_filter";
import { fileURL2PixivReURL } from "./pixivRE/pixivRe";
import { str as CRC32Str } from "crc-32";

const PixivDBClient = {
  pixivRankingImage: new PrismaClient().pixivRankingImage,
  pixivArtwork: new PrismaClient().pixivArtwork,
};

/**
 * 用于与 pixiv.net 进行请求
 */
const PixivClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.42",
    Referer: "https://www.pixiv.net/",
  },
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  timeout: 10000,
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
    console.error(error);
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
    index => !checkIsMangeFromCheerio(items, index),
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
  date?: string,
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
    console.error(error);
    return undefined;
  }
}

/**
 * 根据 pixiv.net/artworks/xxxx 获取对应的 html 代码
 * @param illustId 作品 id
 * @returns
 */
export async function getImageArtworkHtml(illustId: number) {
  try {
    console.log(`[PIXIV] [GET] /artworks/${illustId}`);
    const response = await PixivClient.get(`/artworks/${illustId}`);
    console.log(`[PIXIV] [GET] [${response.status}]`);

    if (response.status !== 200) {
      return null;
    }

    return response.data as string;
  } catch (error: any) {
    if (error.status == 404) {
      await deletePixivRankingItem(illustId);
    }
    return logError(error);
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
    console.error(error);
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
  date?: string,
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
    `[PIXIV] imageListLength[${imageList.length}] filteredImageListLength[${filteredImageList.length}]`,
  );

  // 随机选取图片
  const randomImageIndex = Math.floor(Math.random() * filteredImageList.length); // 随机选取图片
  const targetImageItem = filteredImageList[randomImageIndex];
  const artworkUrl = `https://pixiv.net/artworks/${targetImageItem.illust_id}`;
  console.log(
    `[PIXIV] randomIndex[${randomImageIndex}] artworkUrl[${artworkUrl}]`,
  );

  // 获取原图 url
  const artworkHtml = await getImageArtworkHtml(targetImageItem.illust_id); // 获取网页
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
    targetImageItem.illust_id,
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
  return imageList.filter(item => {
    const tagCheck = !item.tags.some(tag => TAG_EXCLUDE_FILTER.get(tag)); // 不含有对应的 tag
    const typeCheck = Object.keys(TYPE_FILTER).every(_ => {
      const type = _ as keyof typeof TYPE_FILTER;
      return TYPE_FILTER[type] === item.illust_content_type[type];
    }); // 符合 type 的要求
    const illustTypeCheck = !ILLUST_TYPE_FILTER.get(item.illust_type);

    // console.log(tagCheck, typeCheck);
    return tagCheck && typeCheck && illustTypeCheck;
  });
}

/**
 * 从数据库中获取的日榜列表进行筛选
 * @param imageList
 * @returns
 */
export function filterImageListFromDB(imageList: Array<PixivRankingImage>) {
  return imageList.filter(item => {
    const tagCheck = !item.tags
      .split(",")
      .some(tag => TAG_EXCLUDE_FILTER.get(tag)); // 不含有对应的 tag
    const typeCheck = Object.keys(TYPE_FILTER).every(_ => {
      const type = _ as keyof typeof TYPE_FILTER;
      return TYPE_FILTER[type] === item[type];
    }); // 符合 type 的要求
    const illustTypeCheck = !ILLUST_TYPE_FILTER.get(item.illust_type);
    const illustorCheck = !ILLUSTOR_FILTER.get(String(item.user_id));

    // console.log(tagCheck, typeCheck);
    return tagCheck && typeCheck && illustTypeCheck && illustorCheck;
  });
}

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 图片的 url，以 https://i.pximg.net 域名开头
 * @returns
 */
export async function getPixivImageToBase64(url: string) {
  try {
    console.log(
      `[PIXIV] url: ${url} [${format(new Date(), "yyyy-MM-dd HH:mm:ss:SSS")}]`,
    );
    const fileResponse = await PixivClient.get(url, {
      responseType: "arraybuffer",
    });
    console.log(
      `[PIXIV] i.pximg.net response: ${fileResponse.status} ${
        fileResponse.data.length
      } [${format(new Date(), "yyyy-MM-dd HH:mm:ss:SSS")}]`,
    );
    if (fileResponse.status !== 200) {
      return undefined;
    }

    console.log(
      `[PIXIV] [BASE64] start [${format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss:SSS",
      )}]`,
    );

    return `base64://${Buffer.from(fileResponse.data, "binary").toString(
      "base64",
    )}`;
  } catch (error: any) {
    return logError(error);
  }
}

/**
 * 将排行榜的图片在数据库中创建或更新
 * @param imageItem 图片
 * @returns
 */
export async function upsertImageRankingItem(
  imageItem: PixivRankingImageItem,
  rankDate: string,
) {
  try {
    const {
      sexual,
      lo,
      grotesque,
      violent,
      homosexual,
      drug,
      thoughts,
      antisocial,
      religion,
      original,
      furry,
      bl,
      yuri,
    } = imageItem.illust_content_type;

    const {
      illust_id,
      title,
      user_id,
      user_name,
      tags,
      date,
      rank,
      illust_type,
    } = imageItem;

    return await PixivDBClient.pixivRankingImage.upsert({
      where: {
        illust_id: imageItem.illust_id,
      },
      update: {
        rankDate,
        rank,
        illust_type,
      },
      create: {
        illust_id,
        title,
        user_id,
        user_name,
        date,
        sexual,
        lo,
        grotesque,
        violent,
        homosexual,
        drug,
        thoughts,
        antisocial,
        religion,
        original,
        furry,
        bl,
        yuri,
        rankDate,
        tags: tags.join(","),
        rank,
      },
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 检测图片是否存在，依据为 illust_id 和 rankDate
 * @param imageItem 图片
 * @param rankDate 日榜日期
 * @returns
 */
export async function isPixivRankingImageItemExistInDB(
  imageItem: PixivRankingImageItem,
  rankDate: string,
) {
  try {
    const result = await PixivDBClient.pixivRankingImage.findUnique({
      where: { illust_id: imageItem.illust_id },
    });

    if (!result) {
      return result;
    }

    return result.rankDate == rankDate;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 从数据库中获取当天日榜随机图片
 * @param maxLimit 最大排名
 * @returns
 */
export async function getRandomImageWithPixivFromDB(maxLimit: number = 500) {
  try {
    // 获取一页列表

    const now = new Date();
    let rankDay = format(subDays(now, 1), "yyyyMMdd");
    let imageList = await PixivDBClient.pixivRankingImage.findMany({
      where: {
        rankDate: rankDay,
        rank: {
          lte: maxLimit,
        },
      },
    });

    if (imageList.length === 0) {
      rankDay = format(subDays(now, 2), "yyyyMMdd");
      imageList = await PixivDBClient.pixivRankingImage.findMany({
        where: {
          rankDate: rankDay,
          rank: {
            lte: maxLimit,
          },
        },
      });
    }
    // 筛选图片列表
    const filteredImageList = filterImageListFromDB(imageList);
    console.log(
      `[PIXIV] [DB:PixivRankingImage] imageListLength[${imageList.length}] filteredImageListLength[${filteredImageList.length}]`,
    );

    const randomImageIndex =
      Math.abs(CRC32Str(now.toLocaleString(), now.getTime())) %
      filteredImageList.length; // 随机选取图片
    const targetImageItem = filteredImageList[randomImageIndex];
    const artworkUrl = `https://pixiv.net/artworks/${targetImageItem.illust_id}`;
    console.log(
      `[PIXIV] randomIndex[${randomImageIndex}] artworkUrl[${artworkUrl}]`,
    );

    const targetArtwork = await getArtworkFromPixiv(targetImageItem.illust_id);

    if (!targetArtwork) {
      return targetArtwork;
    }

    // 获取图片 url
    const imageSrc = targetArtwork.urls.regular;
    let base64 = await getPixivImageToBase64FromPixivCat(imageSrc);
    console.log(
      `[PIXIV] [BASE64] end [${format(new Date(), "yyyy-MM-dd HH:mm:ss:SSS")}]`,
    );

    if (!base64) {
      base64 = await getPixivImageToBase64(imageSrc);
    }

    return {
      title: targetImageItem.title,
      artist: targetImageItem.user_name,
      link: artworkUrl,
      base64,
    } as PixivImage;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 从数据库或 pixiv 获取图片 url
 * @param illustId 作品 ID
 * @returns
 */
export async function getArtworkFromPixiv(illustId: number) {
  try {
    const pixivArtwork = await PixivDBClient.pixivArtwork.findUnique({
      where: {
        illustId,
      },
    });

    if (pixivArtwork) {
      const createDate = getUTC0TimeString(pixivArtwork.createDate);
      const uploadDate = getUTC0TimeString(pixivArtwork.uploadDate);
      return {
        illustId: String(pixivArtwork.illustId),
        illustTitle: pixivArtwork.illustTitle,
        userId: pixivArtwork.userId,
        userName: pixivArtwork.userName,
        createDate,
        uploadDate,
        urls: {
          thumb: pixivArtwork.url_thumb,
          mini: pixivArtwork.url_mini,
          small: pixivArtwork.url_small,
          regular: pixivArtwork.url_regular,
          original: pixivArtwork.url_original,
        },
      } as PixivArtworksIllustBasic;
    }

    const response = await getImageArtworkHtml(illustId);
    if (!response) {
      return null;
    }
    const root = parseArtworkContentToJSON(response);
    if (!root) {
      return root;
    }

    const artwork = ObjectGet(
      root.illust,
      illustId,
    ) as PixivArtworksIllustBasic;

    PixivDBClient.pixivArtwork
      .create({
        data: {
          illustId: Number(artwork.illustId),
          illustTitle: artwork.illustTitle,
          userId: artwork.userId,
          userName: artwork.userName,
          createDate: new Date(artwork.createDate),
          uploadDate: new Date(artwork.uploadDate),
          url_mini: artwork.urls.mini,
          url_thumb: artwork.urls.thumb,
          url_small: artwork.urls.small,
          url_regular: artwork.urls.regular,
          url_original: artwork.urls.original,
        },
      })
      .then(artwork => {
        console.log(`[PIXIV] [DB:Artwork] create`, artwork.illustId);
      });

    return artwork;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export function getUTC0TimeString(date: Date) {
  return format(utcToZonedTime(date, "UTC"), "yyyy-MM-dd'T'HH:mm:ssxxx");
}

/**
 * 从数据库中删除某个日榜图片
 * @param illustId 作品 ID
 * @returns
 */
export async function deletePixivRankingItem(illustId: number) {
  try {
    const item = await PixivDBClient.pixivRankingImage.delete({
      where: {
        illust_id: illustId,
      },
    });
    return item;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 从数据库中获取当天日榜随机图片
 * @param maxLimit 最大排名
 * @returns
 */
export async function getRandomImageWithPixivFromDB_V2(maxLimit: number = 500) {
  try {
    // 获取一页列表

    const now = new Date();
    let rankDay = format(subDays(now, 1), "yyyyMMdd");
    let imageList = await PixivDBClient.pixivRankingImage.findMany({
      where: {
        rankDate: rankDay,
        rank: {
          lte: maxLimit,
        },
      },
    });

    if (imageList.length === 0) {
      rankDay = format(subDays(now, 2), "yyyyMMdd");
      imageList = await PixivDBClient.pixivRankingImage.findMany({
        where: {
          rankDate: rankDay,
          rank: {
            lte: maxLimit,
          },
        },
      });
    }
    // 筛选图片列表
    const filteredImageList = filterImageListFromDB(imageList);
    console.log(
      `[PIXIV] [DB:PixivRankingImage] imageListLength[${imageList.length}] filteredImageListLength[${filteredImageList.length}]`,
    );

    const randomImageIndex =
      Math.abs(CRC32Str(now.toLocaleString(), now.getTime())) %
      filteredImageList.length; // 随机选取图片
    const targetImageItem: PixivRankingImage =
      filteredImageList[randomImageIndex];

    console.log(
      `[PIXIV] date[${rankDay}] timeStamp[${now.getTime()}] randomIndex[${randomImageIndex}] `,
    );

    const { title, user_name } = targetImageItem;
    const artworkUrl = `https://pixiv.net/artworks/${targetImageItem.illust_id}`;
    console.log(`[PIXIV] artworkUrl[${artworkUrl}]`);

    let targetArtwork = await getArtworkFromPixiv(targetImageItem.illust_id);

    if (!targetArtwork) {
      return targetArtwork;
    }

    // 获取图片 url
    // const imageSrc = targetArtwork.urls.regular;
    const url = fileURL2PixivReURL(targetArtwork.urls.original); // 转换成直达链接

    return {
      title,
      artist: user_name,
      link: artworkUrl,
      base64: url,
    } as PixivImage;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 获取对应日期和排名限制的日榜图片条目
 * @param rankDate 排名日期
 * @param rankLimit 排名限制，target.rank <= rankLimit
 * @returns
 */
export function getRankImages(rankDate: string, rankLimit: number = 500) {
  return PixivDBClient.pixivRankingImage.findMany({
    where: {
      rankDate,
      rank: {
        lte: rankLimit,
      },
    },
  });
}
