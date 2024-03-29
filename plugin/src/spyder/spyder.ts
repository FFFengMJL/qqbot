import { DateTime } from "luxon";
import { RSSHubPixivBookmarkIllust } from "@prisma/client";
import dayjs from "dayjs";
import { MessageType, Message, sendMessage, TargetList } from "./../http/http";
import {
  getHomeImageBase64,
  getNewsCount,
  getNewsList,
  isNewExistInDB,
  upsertNews,
} from "../new/news";
import { New } from "../new/news.type";
import { PixivNormalRankingMode } from "../pixiv/pixiv.type";
import {
  getPixivImageBuffer,
  getRankingListFromPixiv,
  isPixivRankingImageItemExistInDB,
  upsertImageRankingItem,
} from "../pixiv/pixiv";
import {
  createBookmarkItemInDB,
  getBookmarksFromOriginalRSSHub,
  isBookmarkItemExistinDB,
  parseRSSHubPixivBookmarkXML,
} from "../pixiv/rsshub/rsshub";
import sharp from "sharp";
import { load } from "cheerio";
import { getPixivImageBufferFromPixivCat } from "../pixiv/pixivRE/pixivCat";
import { CronJob } from "cron";
import { fileURL2PixivReURL } from "../pixiv/pixivRE/pixivRe";

/**
 * 进行一次完整的流程：获取官网数据 -> 对比是否存在新消息 -> 发送新消息
 * @param targetList 目标列表
 * @returns
 */
export async function spyFF14(targetList: TargetList) {
  try {
    const currentNews = (await getNewsList()).Data;
    const unaddedNew: Array<New> = [];

    console.log(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] currentNews: [${
        currentNews.length
      }]`,
    );

    // 遍历搜寻对应的新闻是否存在
    for (const item of currentNews) {
      const isExist = await isNewExistInDB(item); // 确认新闻是否已经存在，或者是旧闻更新
      // 新闻不存在，也没有报错的情况
      if (!isExist) {
        unaddedNew.push(item);
        sendNews(targetList, item);
      }
    }

    console.log(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] unaddedNews: [${
        unaddedNew.length
      }] ${unaddedNew}`,
    );

    let newNewsInDB = 0;
    if (unaddedNew.length > 0) {
      for (const item of unaddedNew) {
        if (await upsertNews(item)) newNewsInDB++;
      }
    }

    console.log(
      `[${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS",
      )}] [SPYDER] add [${newNewsInDB}] in DB, now [${await getNewsCount()}]`,
    );

    return unaddedNew.length;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

/**
 * 初始化 FF14 国服新闻爬虫
 * @param targetList 目标列表（包含消息类型和目标 ID）
 * @param cronTime 定时时间
 * @returns
 */
export function initFF14Spyder(
  targetList: TargetList,
  cronTime: string | Date | DateTime = "0 */5 6-23 * * *",
) {
  try {
    return new CronJob(cronTime, async () => {
      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [FF14] start`,
      );

      await spyFF14(targetList);

      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [FF14] end`,
      );
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 将新的新闻发送给对应的群/私聊
 * @param targetIdList 目标列表
 * @param news 对应的新闻
 * @returns
 */
export async function sendNews(targetIdList: TargetList, news: New) {
  const homeImage = await getHomeImageBase64(news.HomeImagePath);
  const message: Message = [
    {
      type: "text",
      data: {
        text: `
标题：${news.Title}
摘要：${news.Summary}
详情：${news.Author}
发布日期：${news.PublishDate}`,
      },
    },
  ];

  if (!!homeImage) {
    message.unshift({
      type: "image",
      data: {
        file: homeImage,
      },
    });
  }

  return targetIdList.map(({ targetId, messageType }) =>
    sendMessage(messageType, targetId, message),
  );
}

/**
 * 初始化 pixiv 排行榜爬虫
 * @param mode 榜单类型
 * @param maxPage 最大页数
 * @param cronTime 定期时间
 * @returns
 */
export function initPixivRankingSpyder(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10,
  cronTime: string | Date | DateTime = "0 15,45 12 * * *",
) {
  try {
    return new CronJob(cronTime, async () => {
      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [PIXIV] start`,
      );

      await spyPixivRanking(mode, maxPage);

      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [PIXIV] end`,
      );
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

/**
 * 对 pixiv.net 的榜单进行一次获取
 * @param mode 榜单类型
 * @param maxPage 最大页数 [1, 10]
 * @returns
 */
export async function spyPixivRanking(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10,
) {
  let rankingLength = 0;
  let upsertItemLength = 0;
  for (let page = 1; page <= maxPage; page++) {
    const response = await getRankingListFromPixiv(mode, page);
    if (response) {
      const imageItems = response.contents;
      rankingLength += imageItems.length;
      for (let imageIndex = 0; imageIndex < imageItems.length; imageIndex++) {
        const isExist = await isPixivRankingImageItemExistInDB(
          imageItems[imageIndex],
          response.date,
        );

        if (
          !isExist &&
          (await upsertImageRankingItem(imageItems[imageIndex], response.date))
        ) {
          upsertItemLength++; // 创建/更新成功
        }
      }
      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss:SSS",
        )} [PIXIV] currentPage [${page}] content lenth [${imageItems.length}]`,
      );
    }
  }

  console.log(
    `[${dayjs().format(
      "YYYY-MM-DD HH:mm:ss:SSS",
    )}] [SPYDER] [PIXIV] total [${rankingLength}] image, upsert [${upsertItemLength}] in DB`,
  );

  return upsertItemLength;
}

/**
 * 从 RSSHub 获取对应用户的收藏
 * @param userId 目标用户的 ID
 * @param targetList 需要发送的目标列表
 * @param blurParam 高斯模糊的系数
 * @returns
 */
export async function spyRSSHubPixivBookmark(
  userId: number,
  targetList: TargetList,
  blurParam: number = Math.random() * 2 + 7,
) {
  // 从 RSSHub 获取 xml
  console.log(
    `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [RSSHUB] get xml`,
  );
  let xmlString = await getBookmarksFromOriginalRSSHub(userId);
  if (!xmlString) return xmlString;

  // 解析 xml 成对应的数组
  console.log(
    `[${dayjs().format(
      "YYYY-MM-DD HH:mm:ss:SSS",
    )}] [SPYDER] [RSSHUB] parse xml`,
  );
  const items = parseRSSHubPixivBookmarkXML(xmlString);
  console.log(
    `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [RSSHUB] get [${
      items.length
    }] items`,
  );

  const newItems: Array<RSSHubPixivBookmarkIllust> = [];

  for (const item of items) {
    if (
      !(await isBookmarkItemExistinDB(item)) &&
      (await createBookmarkItemInDB(item))
    ) {
      // 当收藏不在数据库并创建成功后，加入到结果数组中
      newItems.push(item);
    }
  }

  // 当新增数量不为 0 时才进行消息发送
  if (newItems.length && targetList.length) {
    newItems.forEach(async (item) => {
      const url = load(item.description)("img").eq(0).attr("src");
      if (!url) return;
      const directLink = fileURL2PixivReURL(url);

      // 分别从 i.pximg.net 和 i.pixiv.cat 获取图片
      let imageBuffer = await getPixivImageBuffer(url);
      imageBuffer ??= await getPixivImageBufferFromPixivCat(url);

      if (!imageBuffer) return;

      // 高斯模糊图片
      const blurImage = (
        await sharp(imageBuffer).blur(blurParam).toBuffer()
      ).toString("base64");

      targetList.forEach(async ({ messageType, targetId }) => {
        return sendMessage(messageType, targetId, [
          {
            type: "text",
            data: {
              text: "今日推荐:\n",
            },
          },
          {
            type: "image",
            data: {
              file: `base64://${blurImage}`,
              c: 3,
            },
          },
          {
            type: "text",
            data: {
              text: `
作品名：${item.title}
画师：${item.author}
链接：${item.link}
直达：${directLink}`,
            },
          },
        ]);
      });
    });
  }

  console.log(
    `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [SPYDER] [RSSHUB] get [${
      newItems.length
    }] new items`,
  );
  return newItems.length;
}

export async function sendNewPixivBookmarks(
  items: Array<RSSHubPixivBookmarkIllust>,
  messageType: MessageType,
  targetId: Number,
) {
  const combineMessage: Message = items.map((item) => {
    return {
      type: "text",
      data: {
        text: `
${item.title}\t作者：${item.author}
${item.link}`,
      },
    };
  });
  const messages: Message = [
    {
      type: "text",
      data: {
        text: `今日推荐：`,
      },
    },
    ...combineMessage,
  ];

  return await sendMessage(messageType, targetId, messages);
}

/**
 * 初始化 RSSHub pixiv 用户收藏的爬虫
 * @param userId 目标 pixiv 用户
 * @param targetList 发送目标列表
 * @param blurParam 高斯模糊系数
 * @param cronTime 定时时间
 * @returns
 */
export function initRSSHubPixivBookmarkSpyder(
  userId: number,
  targetList: TargetList,
  blurParam: number = Math.random() * 2 + 4,
  cronTime: string | Date | DateTime = "0 */30 * * * *",
) {
  try {
    return new CronJob(cronTime, async () => {
      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss:SSS",
        )}] [SPYDER] [RSSHUB] pixivBookmark start`,
      );

      await spyRSSHubPixivBookmark(userId, targetList, blurParam);

      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss:SSS",
        )}] [SPYDER] [RSSHUB] pixivBookmark end`,
      );
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
