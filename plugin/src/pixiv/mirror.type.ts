export type PixivicRankingParam = {
  page: PixivicPage;
  date: PixivicDate;
  mode: PixivicMode;
  pageSize: PixivicPageSize;
};

export type PixivicMode = "day" | "week" | "month" | "female" | "male";
export type PixivicPage = number;
export type PixivicPageSize = number;
export type PixivicDate = string;

export interface PixvicListResponse {
  message: string;
  data?: Array<PixivicListItem>;
}

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

interface PixivicArtistPreView {
  id: number;
  name: string;
  account: string;
  avatar: string;
}

interface PixivicTag {
  name: string;
  translatedName: string;
  id: number;
}

interface PixivicImageUrls {
  squareMedium: string;
  medium: string;
  large: string;
  original: string;
}
