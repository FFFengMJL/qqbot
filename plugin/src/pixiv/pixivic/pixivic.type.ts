/**
 * api 参数
 */
export type PixivicRankingParam = {
  page: PixivicPage;
  date: PixivicDate;
  mode: PixivicMode;
  pageSize: PixivicPageSize;
};

/**
 * 榜单类型
 */
export type PixivicMode = "day" | "week" | "month" | "female" | "male";
/**
 * 榜单页码
 */
export type PixivicPage = number;
/**
 * 榜单单页数据数量
 */
export type PixivicPageSize = number;
/**
 * 榜单日期
 */
export type PixivicDate = string;

/**
 * pixivic.com 的响应
 */
export interface PixvicListResponse {
  message: string;
  data?: Array<PixivicListItem>;
}

/**
 * pixivic.com 响应的列表数据
 */
export interface PixivicListItem {
  id: number;
  artistId: number;
  title: string;
  type: "illust" | string;
  caption: "" | string;
  artistPreView: PixivicArtistPreView;
  tags: Array<PixivicTag>;
  imageUrls: Array<PixivicImageUrls>;
  tools: Array<string>;
  createDate: Date;
  pageCount: number;
  width: number;
  height: number;
  sanityLevel: number;
  restrict: number;
  totalView: number;
  totalBookmarks: number;
  xrestrict: number;
}

/**
 * 画师预览
 */
interface PixivicArtistPreView {
  id: number;
  name: string;
  account: string;
  avatar: string;
}

/**
 * 图片标签
 */
interface PixivicTag {
  name: string;
  translatedName: string;
  id: number;
}

/**
 * 图片 url，是 pixiv 链接
 */
interface PixivicImageUrls {
  squareMedium: string;
  medium: string;
  large: string;
  original: string;
}
