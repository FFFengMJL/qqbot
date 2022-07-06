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
  isPixivRankingImageItemInDB,
  upsertImageRankingItem,
} from "../pixiv/pixiv";

/**
 * 进行一次完整的流程：获取官网数据 -> 对比是否存在新消息 -> 发送新消息
 * @param messageType
 * @param targetId
 * @returns
 */
export async function spyFF14(messageType: MessageType, targetId: Number) {
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
        sendNews(messageType, targetId, item);
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
  messageType: MessageType,
  targetId: Number,
  spyTime: SpyTime = {
    second: 10,
    minuteInterval: 5,
  }
) {
  setInterval(async () => {
    if (checkTime(new Date(), spyTime)) {
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
          locale: zhCN,
        })}] [SPYDER] [FF14] start`
      );

      await spyFF14(messageType, targetId);
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
          locale: zhCN,
        })}] [SPYDER] [FF14] end`
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
        text: `标题：${news.Title}
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
  const minuteIntervalOK = now.getMinutes() % spyTime.minuteInterval === 0;
  const hourIntervalOK =
    !spyTime.hourInterval ||
    (spyTime.hourInterval && now.getHours() % spyTime?.hourInterval === 0);
  const startHourOK =
    !spyTime.startHour ||
    (spyTime.startHour && now.getHours() >= spyTime.startHour);
  const endHourOK =
    !spyTime.endHour || (spyTime.endHour && now.getHours() <= spyTime.endHour);
  return (
    secondOK && minuteIntervalOK && hourIntervalOK && startHourOK && endHourOK
  );
}

/**
 * 初始化 pixiv 榜单爬虫
 * @param mode 榜单类型
 * @param maxPage 最大页数 [1, 10]
 * @param spyTime 目标时间
 */
export async function initPixivRankingSpyder(
  mode: PixivNormalRankingMode = "daily",
  maxPage: number = 10,
  spyTime: SpyTime = {
    second: 60,
    minuteInterval: 30,
    hourInterval: 11,
    startHour: 10,
    endHour: 12,
  }
) {
  setInterval(async () => {
    if (checkTime(new Date(), spyTime)) {
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
          locale: zhCN,
        })}] [SPYDER] [PIXIV] start`
      );

      spyPixivRanking(mode, maxPage);

      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
          locale: zhCN,
        })}] [SPYDER] [PIXIV] end`
      );
    }
  }, spyTime.second * 1000 * 10); // 10 分钟检查一次
}

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
        if (
          await upsertImageRankingItem(imageItems[imageIndex], response.date)
        ) {
          upsertItemLength++; // 创建/更新成功
        }
      }
      console.log(
        `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
          locale: zhCN,
        })} [PIXIV] currentPage [${page}] content lenth [${imageItems.length}]`
      );
    }
  }

  console.log(
    `[${format(new Date(), "yyyy-MM-dd HH:mm:ss", {
      locale: zhCN,
    })}] [SPYDER] [PIXIV] total [${rankingLength}] image, upsert [${upsertItemLength}] in DB`
  );

  return upsertItemLength;
}
