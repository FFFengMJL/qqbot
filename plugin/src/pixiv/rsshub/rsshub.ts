import axios from "axios";
import * as cheerio from "cheerio";
import { PixivImage } from "../pixiv.type";
import { getPixivImageToBase64FromPixivCat } from "../pixivCat";
import { RSSHubPixivRankingDate, RSSHubPixivRankingMode } from "./rsshub.type";

/**
 * 对 rsshub 的连接，用户获取 pixiv 榜单
 */
const RSSHubClient = axios.create({
  timeout: 20000,
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  baseURL: "https://rsshub.app",
});

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
  } catch (error) {
    console.log(error);
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
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
