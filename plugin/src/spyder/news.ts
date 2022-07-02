import axios from "axios";
import { Catagory, ResponseArticle, ResponseNewList } from "./news.type";

const FF14ChineClent = axios.create({
  baseURL: "https://ff.web.sdo.com/inc/newdata.ashx",
  timeout: 5000,
  headers: {
    userAgent:
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
  gameCode: string = "ff"
) {
  const response = await FF14ChineClent.get(
    `?url=List?gameCode=${gameCode}&category=${categorys.join(
      ","
    )}&pageIndex=${pageIndex}&pageSize=${pageSize}`
  );
  return response.data as ResponseNewList;
}

/**
 * 获取对应的文章
 * @param id 文章 id
 * @param gameCode 游戏类型
 * @returns
 */
export async function getArticle(id: number, gameCode: string = "ff") {
  const response = await FF14ChineClent.get(
    `?url=detail?gameCode=${gameCode}&id=${id}`
  );

  return response.data as ResponseArticle;
}
