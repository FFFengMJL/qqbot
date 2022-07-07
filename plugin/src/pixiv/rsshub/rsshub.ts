import axios from "axios";
import * as cheerio from "cheerio";
import { PixivImage } from "../pixiv.type";
import { getPixivImageToBase64FromPixivCat } from "../pixivCat";
import { RSSHubPixivRankingDate, RSSHubPixivRankingMode } from "./rsshub.type";
import { PrismaClient, RSSHubPixivBookmarkIllust } from "@prisma/client";
import { load } from "cheerio";
import { isEqual } from "date-fns";

/**
 * 对 rsshub 的连接，用户获取 pixiv 榜单
 */
const RSSHubClient = axios.create({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  baseURL: "https://rsshub.app",
});

const RSSuhPixivBookmarkDBClient = new PrismaClient().rSSHubPixivBookmarkIllust;

/**
 * 从 rsshub 获取榜单
 * @param mode 榜单类型
 * @param date 榜单日期（可选）
 * @returns xml 字符串
 */
export async function getPixivRankListFromRSShub(
  mode: RSSHubPixivRankingMode,
  date?: RSSHubPixivRankingDate
) {
  try {
    const response = await RSSHubClient.get("/pixiv/ranking/", {
      params: {
        mode,
        date,
      },
    });

    // 如果状态码不是200，则返回 undefined
    if (response.status !== 200) return undefined;
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
 * 从 RSSHub 获取日榜图片列表并以此获取一张 pixiv 图片
 * @param mode 榜单类型
 * @param date 榜单日期（可选）
 * @returns 对应图片的 base64 字符串
 */
export async function getRandomImageWithRSSHub(
  mode: RSSHubPixivRankingMode = "day",
  date?: RSSHubPixivRankingDate
) {
  // 获取列表
  const responseString = await getPixivRankListFromRSShub(mode, date);

  if (!responseString) {
    return undefined;
  }

  // 解析 xml，得到 item 标签的列表
  const items = cheerio.load(responseString, {
    xmlMode: true,
  })("item");

  console.log(`[PIXIV] itemListLength: ${items.length}`);

  const index = Math.floor(Math.random() * items.length); // 随机选择

  const artist = items.eq(index).find("author").text(); // 作者
  const link = items.eq(index).find("link").text(); // 作品链接
  const title = items
    .eq(index)
    .find("title")
    .text()
    .split(" ")
    .slice(1)
    .join(" "); // 作品名
  const imgSrc = cheerio.load(items.eq(index).text())("img").attr("src"); // 获取图片链接

  if (!imgSrc) return undefined;

  const imgCatUrl = imgSrc.replace("i.pximg.net", "i.pixiv.cat"); // 对域名进行替换
  const base64 = await getPixivImageToBase64FromPixivCat(imgCatUrl); // 得到 base64 字符串

  return {
    artist,
    link,
    base64,
    title,
  } as PixivImage;
}

/**
 * 从 RSSHub 获取特定用户的收藏
 * @param userId 用户 id, 可在用户主页 URL 中找到
 * @returns xml 字符串
 */
export async function getBookmarksFromRSSHub(userId: number) {
  try {
    const response = await RSSHubClient.get(`/pixiv/user/bookmarks/${userId}`);
    if (response.status !== 200) return null;

    return response.data as string;
  } catch (error: any) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      // console.log(error.response.data);
      console.log("[ERROR] response status", error.response.status);
      console.log("[ERROR] response headers", error.response.headers);
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
      // 而在node.js中是 http.ClientRequest 的实例
      console.log("[ERROR] request ", error.request);
    } else {
      // 发送请求时出了点问题
      console.log("[Error] message", error.message);
    }
    console.log("[ERROR] config", error.config);
    return undefined;
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
      link.replace("https://www.pixiv.net/artworks/", "")
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
    console.log(error);
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
    console.log(error);
    return undefined;
  }
}
