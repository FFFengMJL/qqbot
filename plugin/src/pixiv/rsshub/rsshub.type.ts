/**
 * 普通排行榜类型
 */
export type RSSHubPixivNormalRankingMode =
  | "day"
  | "week"
  | "month"
  | "day_male"
  | "day_female"
  | "week_original"
  | "week_rookie";

/**
 * R18 排行榜类型
 */
export type RSSHubPixivR18RankingMode =
  | "day_r18"
  | "day_male_r18"
  | "day_female_r18"
  | "week_r18"
  | "week_r18g";

export type RSSHubPixivRankingMode =
  | RSSHubPixivNormalRankingMode
  | RSSHubPixivR18RankingMode;

/**
 * 形式为 '2018-4-25'
 */
export type RSSHubPixivRankingDate = string;
