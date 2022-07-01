import axios from "axios";
import { Catagory, ResponseArticle, ResponseNewList } from "./news.type";

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
  pageSize: Number = 10,
  pageIndex: Number = 0,
  gameCode: String = "ff"
) {
  const targetURL = `${URL}?url=List?gameCode=${gameCode}&category=${categorys.join(
    ","
  )}&pageIndex=${pageIndex}&pageSize=${pageSize}`;

  const response = await axios.get(targetURL, {
    timeout: 5000,
  });
  return response.data as ResponseNewList;
}

/**
 * 获取对应的文章
 * @param id 文章 id
 * @param gameCode 游戏类型
 * @returns
 */
export async function getArticle(id: Number, gameCode: String = "ff") {
  const response = await axios.get(
    `${URL}?url=detail?gameCode=${gameCode}&id=${id}`
  );

  return response.data as ResponseArticle;
}
