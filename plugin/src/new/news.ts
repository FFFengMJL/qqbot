import axios from "axios";
import { Catagory, New, ResponseArticle, NewsResponse } from "./news.type";
import dayjs from "dayjs";
import { logError } from "../utils/error";
import { PrismaClient } from "@prisma/client";

const newsDBClient = new PrismaClient().news;

const FF14ChineClent = axios.create({
  baseURL: "https://ff.web.sdo.com/inc/newdata.ashx",
  timeout: 5000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
});

/**
 * 获取新闻列表
 * @param categorys 类型
 * @param pageSize 结果数量
 * @param pageIndex 文章索引
 * @param gameCode 游戏类型
 * @returns 相关响应
 */
export async function getNewsList(
  categorys: Array<Catagory> = [5309, 5310, 5311, 5312, 5313],
  pageSize: number = 10,
  pageIndex: number = 0,
  gameCode: string = "ff",
) {
  const response = await FF14ChineClent.get(
    `?url=List?gameCode=${gameCode}&category=${categorys.join(
      ",",
    )}&pageIndex=${pageIndex}&pageSize=${pageSize}`,
  );
  return response.data as NewsResponse;
}

/**
 * 获取对应的文章
 * @param id 文章 id
 * @param gameCode 游戏类型
 * @returns
 */
export async function getArticle(id: number, gameCode: string = "ff") {
  const response = await FF14ChineClent.get(
    `?url=detail?gameCode=${gameCode}&id=${id}`,
  );

  return response.data as ResponseArticle;
}

/**
 * 检查该新闻在数据库中是否已经存在，判断依据为 ID 和 PublishDate
 * @param singleNew 单个新闻
 * @returns
 */
export async function isNewExistInDB(singleNew: New) {
  try {
    const targetNew = await newsDBClient.findUnique({
      where: {
        Id: singleNew.Id,
      },
    });

    // 如果目标不存在
    if (!targetNew) {
      return false;
    }

    // 如果存在，则需要比较发布日期
    const currentDate = new Date(singleNew.PublishDate);
    return dayjs(currentDate).isSame(targetNew.PublishDate);
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 更新或创建新闻，如果存在就更新，如果不存在就创建
 * @param singleNew 单个新闻
 * @returns
 */
export async function upsertNews(singleNew: New) {
  try {
    return await newsDBClient.upsert({
      where: {
        Id: singleNew.Id,
      },
      update: {
        Summary: singleNew.Summary,
        Title: singleNew.Title,
        PublishDate: new Date(singleNew.PublishDate),
      },
      create: {
        Id: singleNew.Id,
        Articletype: singleNew.Articletype,
        ApplicationCode: singleNew.ApplicationCode,
        CategoryCode: singleNew.CategoryCode,
        SortIndex: singleNew.SortIndex,
        GroupIndex: singleNew.GroupIndex,
        TitleClass: singleNew.TitleClass,
        Title: singleNew.Title,
        Summary: singleNew.Summary,
        Author: singleNew.Author,
        PublishDate: new Date(singleNew.PublishDate),
        OutLink: singleNew.OutLink,
        HomeImagePath: singleNew.HomeImagePath,
      },
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 获取数据库中新闻的数量
 * @returns
 */
export async function getNewsCount() {
  try {
    return await newsDBClient.count();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 获取新闻主页的图片
 * @param url
 * @return 返回 base64 格式的字符串
 */
export async function getHomeImageBase64(url: string) {
  try {
    const { status, data } = await FF14ChineClent.get(url, {
      responseType: "arraybuffer",
    });

    if (status !== 200) {
      return undefined;
    }

    return `base64://${Buffer.from(data, "binary").toString("base64")}`;
  } catch (error) {
    return logError(error);
  }
}
