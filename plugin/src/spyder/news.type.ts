const URL = `https://ff.web.sdo.com/inc/newdata.ashx`;

export interface New {
  Id: Number; // 文章 Id
  Articletype?: Number; // 文章类型
  ApplicationCode?: Number; // 不知道是啥
  CategoryCode?: Catagory; // 类型代码
  SortIndex?: Number; // 不知道是啥
  GroupIndex?: Number; // 不知道是啥
  TitleClass: String; // 标题类型，但是都是空的。。。。
  Title: String; // 标题
  Summary: String; // 摘要
  Author: String; // 实际上是文章链接
  PublishDate: Date; // 发布日期
  OutLink: String; // 外链（对于 SQ 分类有，其他都没有）
  HomeImagePath: String; // 封面图
}

export type NewList = Array<New>;

export interface BasicResponse {
  Code: String; // 估计是报错代码
  Message: String; // 估计是报错信息
}

export type ResponseNewList = BasicResponse & {
  Code: String; // 估计是报错代码
  Message: String; // 估计是报错信息
  PageCount: Number; // 页数
  TotalCount: Number; // 总数
  RecordCount: Number; // 记录数量
  Data: NewList; // 具体数据
};

export type ResponseArticle = BasicResponse & {
  Data: Article;
};

export type Article = Omit<
  New,
  "Articletype" | "ApplicationCode" | "SortIndex" | "GroupIndex" | "TitleClass"
> & {
  Content: String;
};

export enum Catagory {
  SQ = 5309, // 盛趣的活动
  Topic, // 已知有商城上新、季节活动、维护通告、直播预告
  OLD, // 未知分类，最新的为獭獭鲶鲶活动（2021/05/19 18:45:40）
  Notice, // 服务器维护完成公告、封禁名单等
  WTF, // 什么老中老分类，乱的一批，最新的是19年的 CICF 的
}
