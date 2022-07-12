import { CronJob } from "cron";
import { DateTime } from "luxon";
import { format } from "date-fns";
import { getRandomImageWithPixivFromDB_V2 } from "../pixiv/pixiv";
import {
  Message,
  sendMessage,
  MessageType,
  MessageResponse,
} from "./../http/http";

/**
 * 整点报时闹钟
 * @param cronTime 定时设置
 * @param targetList 目标群聊/私聊列表
 * @param pixivRankLimit pixiv 榜单排名下限
 */
export function initClock(
  targetList: Array<{ targetType: MessageType; targetId: Number }>,
  pixivRankLimit: number = 0,
  cronTime: string | Date | DateTime = "0 0 * * * *"
) {
  try {
    console.log(`[INIT] [CLOCK] Set a Clock
  cronTime: [${cronTime}]
  targetList [
    ${targetList
      .map((target) => `targetType ${target.targetType} ${target.targetId}`)
      .join("\n\t\t")}
  ]`);
    return new CronJob(cronTime, () => clock(targetList, pixivRankLimit));
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * 进行一次报时
 * @param targetList 目标列表
 * @param pixivRankLimit pixiv 排行榜限制
 * @returns
 */
export async function clock(
  targetList: Array<{ targetType: MessageType; targetId: Number }>,
  pixivRankLimit: number = 0
) {
  const now = new Date();
  const postMessage: Message = [
    {
      type: "text",
      data: {
        text: `现在时间是：${now.toLocaleString("zh-CN", {
          hourCycle: "h23",
          dateStyle: "full",
          timeStyle: "medium",
        })}`,
      },
    },
  ];

  const randomPixivImage = await getRandomImageWithPixivFromDB_V2(
    pixivRankLimit
  );

  if (!!randomPixivImage) {
    const randomPixivImageMessage: Message = [
      {
        type: "image",
        data: {
          file: randomPixivImage.base64,
          c: 3,
        },
      },
      {
        type: "text",
        data: {
          text: `
作品名：${randomPixivImage.title}
画师：${randomPixivImage.artist}
链接：${randomPixivImage.link}`,
        },
      },
    ];
    postMessage.push(...randomPixivImageMessage);
  }

  targetList.forEach(({ targetType, targetId }) => {
    return sendMessage(targetType, targetId, postMessage).then((result) => {
      console.log(
        `[${format(
          now,
          "yyyy-MM-dd HH:mm:ss"
        )}] [CLOCK] send [${targetType}] [${targetId}] [${result?.status}]`
      );
    });
  });

  return targetList.length;
}
