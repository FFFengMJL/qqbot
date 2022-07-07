export interface PixivImage {
  artist: string;
  title: string;
  link: string;
  base64: string;
}

export const RANKING_PAGES = 10;

export type PixivNormalRankingMode =
  | "daily"
  | "weekly"
  | "monthly"
  | "rookie"
  | "original"
  | "male"
  | "female";

/**
 * 排行榜接口的响应
 */
export interface PixivRankingReponse {
  contents: Array<PixivRankingImageItem>;
  mode: PixivNormalRankingMode;
  content: string;
  page: number;
  prev: number | false;
  next: number | boolean;
  date: string;
  prev_date: string | false;
  next_date: string | boolean;
  rank_total: number;
}

export interface PixivRankingImageItem {
  title: string;
  date: string;
  tags: Array<string>;
  url: string;
  illust_type: string;
  illust_book_style: string;
  illust_page_count: string;
  user_name: string;
  profile_img: string;
  illust_content_type: IllustContentType;
  illust_series: IllustSeries | false;
  illust_id: number;
  width: number;
  height: number;
  user_id: number;
  rank: number;
  yes_rank?: number;
  rating_count: number;
  view_count: number;
  illust_upload_timestamp: number;
  attr: string;
}

interface IllustSeries {
  illust_series_id: string;
  illust_series_user_id: string;
  illust_series_title: string;
  illust_series_caption: string;
  illust_series_content_count: string;
  illust_series_create_datetime: string;
  illust_series_content_illust_id: string;
  illust_series_content_order: string;
  page_url: string;
}

interface IllustContentType {
  sexual: number;
  lo: boolean;
  grotesque: boolean;
  violent: boolean;
  homosexual: boolean;
  drug: boolean;
  thoughts: boolean;
  antisocial: boolean;
  religion: boolean;
  original: boolean;
  furry: boolean;
  bl: boolean;
  yuri: boolean;
}

export const TAG_EXCLUDE_FILTER = ["漫画", "創作BL", "BL"];
export const TYPE_FILTER: Partial<IllustContentType> = {
  grotesque: false,
  violent: false,
  drug: false,
  antisocial: false,
  bl: false,
  furry: false,
};
export const ILLUST_TYPE_FILETER = ["1"];

export interface PixivArtworksContent {
  timestamp: string;
  illust: Object;
  user: Object;
}

export interface PixivArtworksIllustBasic {
  illustId: string;
  illustTitle: string;

  userId: string;
  userName: string;

  createDate: string;
  uploadDate: string;

  urls: PixivArtworksUrls;
}

/**
 * pixiv.net/artworks/xxx 页面的作品字段
 */
export interface PixivArtworksIllust {
  illustId: string;
  illustTitle: string;
  illustComment: string;

  id: string;
  title: string;
  description: string;
  illustType: number;
  createDate: string;
  uploadDate: string;

  restrict: number;
  xRestrict: number;
  sl: number;

  urls: PixivArtworksUrls;
  tags: PixivArtworksTags;

  alt: string;
  storableTags: Array<string>;

  userId: string;
  userName: string;
  userAccount: string;
  userIllusts: Object;

  likeData: boolean;

  width: number;
  height: number;
  pageCount: number;
  bookmarkCount: number;
  likeCount: number;
  commentCount: number;
  responseCount: number;
  viewCount: number;
  bookStyle: number;

  isHowto: boolean;
  isOriginal: boolean;

  imageResponseOutData: Array<any>;
  imageResponseData: Array<any>;
  imageResponseCount: number;

  pollData: null | any;
  seriesNavData: null | any;

  descriptionBoothId: null | any;
  descriptionYoutubeId: null | any;

  comicPromotion: null | any;
  fanboxPromotion: null | PixivArtworksUserFanboxPromotion;
  contestBanners: Array<any>;
  isBookmarkable: boolean;
  bookmarkData: null | any;
  contestData: null | any;
  zoneConfig: Object; // TODO
  extraData: Object; // TODO
  titleCaptionTranslation: {
    workTtiel: null | any;
    workCaption: null | any;
  };
  isUnlisted: boolean;
  request: null | any;
  commentOff: number;
  noLoginData: Object; // TODO
}

interface PixivArtworksUserFanboxPromotion {
  userName: string;
  userImageUrl: string;
  contentUrl: string;
  description: string;
  imageUrl: string;
  imageUrlMobile: string;
  hasAdultContent: boolean;
}

interface PixivArtworksUserIllust {
  id: string;
  title: string;
  illustType: string;

  xRestrict: number;
  restrict: number;
  sl: number;

  url: string;
  description: string;
  tags: Array<string>;

  userId: string;
  userName: string;

  width: number;
  height: number;
  pageCount: number;
  isBookmarkable: boolean;
  bookmarkData: null | any;
  alt: string;
  titleCaptionTranslation: {
    workTtiel: null | any;
    workCaption: null | any;
  };
  createDate: string;
  updateDate: string;

  isUnlisted: boolean;
  isMasked: boolean;
}

/**
 * pixiv.net/artworks/xxx 页面的作品 URL 字段
 */
interface PixivArtworksUrls {
  mini: string;
  thumb: string;
  small: string;
  regular: string;
  original: string;
}

/**
 * pixiv.net/artworks/xxx 页面的作品 tags 字段
 */
interface PixivArtworksTags {
  authorId: string;
  isLocked: boolean;
  tags: Array<PixivArtworksTag>;
  writeable: boolean;
}

/**
 * pixiv.net/artworks/xxx 页面的作品 tags 字段中的具体 tag
 */
interface PixivArtworksTag {
  tag: string;
  locked: boolean;
  deletable: boolean;
  userId: string;
  userName: string;
}

/**
 * pixiv.net/artworks/xxx 页面的用户字段
 */
interface PixivArtworksUser {
  userId: string;
  name: string;
  image: string;
  imageBig: string;
  premium: boolean;
  isFollowed: boolean;
  isMypixiv: boolean;
  isBlodcking: boolean;
  background: string | null;
  sketchLiveId: string | null;
  partial: number;
  acceptRequest: boolean;
  sketchLives: Array<any>;
}
