import { RSSHubPixivBookmarkIllust } from "@prisma/client";
import { zhCN } from "date-fns/locale";
import { format } from "date-fns-tz";
import { MessageType, Message, sendMessage } from "./../http/http";
import {
  getNewsCount,
  getNewsList,
  isNewExistInDB,
  upsertNews,
} from "../new/news";
import { New } from "../new/news.type";
import { SpyTime } from "./spyder.type";
import { PixivNormalRankingMode } from "../pixiv/pixiv.type";
import {
  getRankingListFromPixiv,
  isPixivRankingImageItemExistInDB,
  upsertImageRankingItem,
} from "../pixiv/pixiv";
import {
  createBookmarkItemInDB,
  getBookmarksFromRSSHub,
  isBookmarkItemExistinDB,
  parseRSSHubPixivBookmarkXML,
} from "../pixiv/rsshub/rsshub";

/**
 * 进行一次完整的流程：获取官网数据 -> 对比是否存在新消息 -> 发送新消息
 * @param messageType
 * @param targetId
 * @returns
 */
export async function spyFF14(
  targetList: Array<{ messageType: MessageType; targetId: Number }>
) {
  try {
    const currentNews = (await getNewsList()).Data;
    const unaddedNew: Array<New> = [];

    console.log(`[SPYDER] currentNews: [${currentNews.length}]`);

    // 遍历搜寻对应的新闻是否存在
    for (const item of currentNews) {
      const isExist = await isNewExistInDB(item); // 确认新闻是否已经存在，或者是旧闻更新
      // 新闻不存在，也没有报错的情况
      if (!isExist) {
        unaddedNew.push(item);
        targetList.forEach(async ({ messageType, targetId }) => {
          await sendNews(messageType, targetId, item);
        });
      }
    }

    console.log(`[SPYDER] unaddedNews: [${unaddedNew.length}] ${unaddedNew}`);

    let newNewsInDB = 0;
    if (unaddedNew.length > 0) {
      for (const item of unaddedNew) {
        if (await upsertNews(item)) newNewsInDB++;
      }
    }

    console.log(
      `[SPYDER] add [${newNewsInDB}] in DB, now [${await getNewsCount()}]`
    );

    return unaddedNew.length;
  } catch (err) {
    console.log(err);
    return undefined;
  }
}

/**
 * 初始化 FF14 国服爬虫
 * @param messageType 消息类型（群聊/私聊）
 * @param targetId 目标 ID
 * @param spyTime 间隔时间
 */
export async function initFF14Spyder(
  targetList: Array<{ messageType: MessageType; targetId: Number }>,
  spyTime: SpyTime = {
    second: 10,
    minuteInterval: 5,
  }
) {
  setInterval(async () => {
    if (checkTime(new Date(), spyTime)) {
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] [SPYDER] [FF14] start`
      );

      await spyFF14(targetList);
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] [SPYDER] [FF14] end`
      );
    }
  }, spyTime.second * 1000);
}

/**
 * 将新的新闻发送给对应的群/私聊
 * @param messgeType 消息类型（私聊/群聊）
 * @param targetId 目标 ID
 * @param news 对应的新闻
 * @returns
 */
export async function sendNews(
  messgeType: MessageType,
  targetId: Number,
  news: New
) {
  const message: Message = [
    {
      type: "image",
      data: {
        file: news.HomeImagePath,
      },
    },
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
  return await sendMessage(messgeType, targetId, message);
}

/**
 * 检查时间是否符合要求
 * @param now 当前时间
 * @param spyTime 目标时间
 * @returns
 */
function checkTime(now: Date, spyTime: SpyTime) {
  const secondOK = now.getSeconds() <= spyTime.second;
  const minuteOK = !spyTime.minute || now.getMinutes() <= spyTime.minute;
  const minuteIntervalOK =
    !spyTime.minuteInterval || now.getMinutes() % spyTime.minuteInterval === 0;
  const hourIntervalOK =
    !spyTime.hourInterval || now.getHours() % spyTime.hourInterval === 0;
  const startHourOK = !spyTime.startHour || now.getHours() >= spyTime.startHour;
  const endHourOK = !spyTime.endHour || now.getHours() <= spyTime.endHour;
  return (
    secondOK &&
    minuteOK &&
    minuteIntervalOK &&
    hourIntervalOK &&
    startHourOK &&
    endHourOK
  );
}

/**
 * 初始化 pixiv 日榜爬虫
 * @param mode 榜单模式
 * @param maxPage 最大页数（总共50 * 10页 500 张图）
 * @param minutesLess 小于这个数值则进行一次爬取
 * @param hour 进行爬取的小时时间
 * @param intervalMS setInterval 的时间，即间隔多少 ms 进行一次时间检查
 */
export async function initPixivRankingSpyder(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10,
  minutesLess = 20,
  hour = 12,
  intervalMS = 60 * 1000 * 10
) {
  setInterval(async () => {
    const now = new Date();
    const minutesOK = now.getMinutes() <= minutesLess;
    const hourOK = now.getHours() == hour;

    if (minutesOK && hourOK) {
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] [SPYDER] [PIXIV] start`
      );

      spyPixivRanking(mode, maxPage);

      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] [SPYDER] [PIXIV] end`
      );
    }
  }, intervalMS); // 10 分钟检查一次
}

/**
 * 对 pixiv.net 的榜单进行一次获取
 * @param mode 榜单类型
 * @param maxPage 最大页数 [1, 10]
 * @returns
 */
export async function spyPixivRanking(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10
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
          response.date
        );

        if (
          !isExist &&
          (await upsertImageRankingItem(imageItems[imageIndex], response.date))
        ) {
          upsertItemLength++; // 创建/更新成功
        }
      }
      console.log(
        `[${format(
          new Date(),
          "yyyy-MM-dd HH:mm:ss"
        )} [PIXIV] currentPage [${page}] content lenth [${imageItems.length}]`
      );
    }
  }

  console.log(
    `[${format(
      new Date(),
      "yyyy-MM-dd HH:mm:ss"
    )}] [SPYDER] [PIXIV] total [${rankingLength}] image, upsert [${upsertItemLength}] in DB`
  );

  return upsertItemLength;
}

export async function spyRSSHubPixivBookmark(
  userId: number,
  targetList: Array<{ messageType: MessageType; targetId: Number }>
) {
  // 从 RSSHub 获取 xml
  console.log(`[SPYDER] [RSSHUB] get xml`);
  const xmlString = await getBookmarksFromRSSHub(userId);
  if (!xmlString) {
    return xmlString;
  }

  // 解析 xml 成对应的数组
  console.log(`[SPYDER] [RSSHUB] parse xml`);
  const items = parseRSSHubPixivBookmarkXML(xmlString);
  console.log(`[SPYDER] [RSSHUB] get [${items.length}] items`);

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
  if (newItems.length) {
    targetList.forEach(async ({ messageType, targetId }) => {
      return await sendNewPixivBookmarks(newItems, messageType, targetId);
    });
  }

  console.log(`[SPYDER] [RSSHUB] get [${newItems.length}] new items`);
  return newItems.length;
}

export async function sendNewPixivBookmarks(
  items: Array<RSSHubPixivBookmarkIllust>,
  messageType: MessageType,
  targetId: Number
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

export async function initRSSHubPixivBookmarkSpyder(
  userId: number,
  targetList: Array<{ messageType: MessageType; targetId: Number }>
) {
  setInterval(async () => {
    console.log(
      `[${format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss"
      )}] [SPYDER] [RSSHUB] pixivBookmark start`
    );
    await spyRSSHubPixivBookmark(userId, targetList);
    console.log(
      `[${format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss"
      )}] [SPYDER] [RSSHUB] pixivBookmark end`
    );
  }, 30 * 60 * 1000);
}
