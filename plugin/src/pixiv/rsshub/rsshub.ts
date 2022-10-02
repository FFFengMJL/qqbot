import axios from "axios";
import * as cheerio from "cheerio";
import { PixivImage } from "../pixiv.type";
import { getPixivImageToBase64FromPixivCat } from "../pixivRE/pixivCat";
import { RSSHubPixivRankingDate, RSSHubPixivRankingMode } from "./rsshub.type";
import { PrismaClient, RSSHubPixivBookmarkIllust } from "@prisma/client";
import { load } from "cheerio";
import { logError } from "../../utils/error";

const OriginalRSSHubClient = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  baseURL: "http://rsshub.app",
  timeout: 5000,
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
});

const RSSuhPixivBookmarkDBClient = new PrismaClient().rSSHubPixivBookmarkIllust;

/**
 * 从 RSSHub 获取特定用户的收藏
 * @param userId 用户 id, 可在用户主页 URL 中找到
 * @returns xml 字符串
 */
export async function getBookmarksFromOriginalRSSHub(userId: number) {
  try {
    const response = await OriginalRSSHubClient.get(
      `/pixiv/user/bookmarks/${userId}`,
    );
    if (response.status !== 200) return null;

    return response.data as string;
  } catch (error: any) {
    return logError(error);
  }
}

/**
 * 解析 RSSHub 返回的 xml 字符串并生成对应的收藏列表
 * @param xml xml 字符串
 * @returns
 */
export function parseRSSHubPixivBookmarkXML(xml: string) {
  const root = load(xml, {
    xmlMode: true,
  });

  const items = root("item");
  const bookmarks: Array<RSSHubPixivBookmarkIllust> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items.eq(i);
    const title = item.find("title").text();
    const description = item.find("description").text();
    const link = item.find("link").text();
    const illustId = Number(
      link.replace("https://www.pixiv.net/artworks/", ""),
    );
    const author = load(description)("p")
      .first()
      .text()
      .split(" - ")
      .slice(0, -2)
      .join(" - ")
      .replace("画师：", "");
    const pubDate = new Date(item.find("pubDate").text());

    bookmarks.push({
      illustId,
      title,
      author,
      description,
      link,
      pubDate,
    });
  }

  return bookmarks;
}

/**
 * 判断收藏是否已经在数据库中
 * @param item
 * @returns
 */
export async function isBookmarkItemExistinDB(item: RSSHubPixivBookmarkIllust) {
  try {
    const result = await RSSuhPixivBookmarkDBClient.findUnique({
      where: {
        illustId: item.illustId,
      },
    });
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 在数据库中创建对应的收藏
 * @param item 收藏对象
 * @returns
 */
export async function createBookmarkItemInDB(item: RSSHubPixivBookmarkIllust) {
  try {
    const { illustId, title, description, link, pubDate, author } = item;
    const result = await RSSuhPixivBookmarkDBClient.create({
      data: {
        illustId,
        title,
        author,
        description,
        link,
        pubDate,
      },
    });
    return result;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
