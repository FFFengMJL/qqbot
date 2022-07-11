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
 * @param {number} startTime 开始时间
 * @param {number} hourInterval 间隔时间
 * @param {number} targetType 目标类型（群聊/私聊）
 * @param {number} targetId 目标 ID
 */
export function initClock(
  startTime = 0,
  hourInterval = 3,
  targetList: Array<{ targetType: MessageType; targetId: Number }>
) {
  setInterval(() => clock(startTime, hourInterval, targetList), 100);
  console.log(`\
Set a Clock:
startTime - ${startTime} hourInterval - ${hourInterval}
targetList: ${targetList}`);
  return 1;
}

export async function clock(
  startTime = 0,
  hourInterval = 3,
  targetList: Array<{ targetType: MessageType; targetId: Number }>
) {
  const now = new Date();
  if (
    now.getMilliseconds() <= 100 &&
    now.getSeconds() == 0 &&
    now.getMinutes() == 0 &&
    now.getHours() % hourInterval == startTime
  ) {
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

    const randomPixivImage = await getRandomImageWithPixivFromDB_V2(300);

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
  return 0;
}
