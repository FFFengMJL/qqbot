export const FFXIV_CHINA_NEWS_HOST = `https://ff.web.sdo.com/inc/newdata.ashx`;

export interface New {
  Id: number; // 文章 Id
  Articletype?: number; // 文章类型
  ApplicationCode?: number; // 不知道是啥
  CategoryCode?: Catagory; // 类型代码
  SortIndex?: number; // 不知道是啥
  GroupIndex?: number; // 不知道是啥
  TitleClass: string; // 标题类型，但是都是空的。。。。
  Title: string; // 标题
  Summary: string; // 摘要
  Author: string; // 实际上是文章链接
  PublishDate: string; // 发布日期
  OutLink: string; // 外链（对于 SQ 分类有，其他都没有）
  HomeImagePath: string; // 封面图
}

export type NewList = Array<New>;

export interface BasicResponse {
  Code: string; // 估计是报错代码
  Message: string; // 估计是报错信息
}

export type NewsResponse = BasicResponse & {
  Code: string; // 估计是报错代码
  Message: string; // 估计是报错信息
  PageCount: number; // 页数
  TotalCount: number; // 总数
  RecordCount: number; // 记录数量
  Data: NewList; // 具体数据
};

export type ResponseArticle = BasicResponse & {
  Data: Article;
};

export type Article = Omit<
  New,
  "Articletype" | "ApplicationCode" | "SortIndex" | "GroupIndex" | "TitleClass"
> & {
  Content: string;
};

export enum Catagory {
  SQ = 5309, // 盛趣的活动
  Topic, // 已知有商城上新、季节活动、维护通告、直播预告
  OLD, // 未知分类，最新的为獭獭鲶鲶活动（2021/05/19 18:45:40）
  Notice, // 服务器维护完成公告、封禁名单等
  WTF, // 什么老中老分类，乱的一批，最新的是19年的 CICF 的
}
