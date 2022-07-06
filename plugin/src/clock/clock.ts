import {
  getRandomImageWithPixiv,
  getRandomImageWithPixivFromDB,
} from "../pixiv/pixiv";
import { getRandomImageWithRSSHub } from "../pixiv/rsshub";
import { Message, sendMessage, MessageType } from "./../http/http";

/**
 * 整点报时闹钟
 * @param {number} startTime
 * @param {number} timeInterval
 * @param {number} targetType
 * @param {number} targetId
 */
export function initClock(
  startTime = 0,
  hourInterval = 3,
  targetType: MessageType = "group",
  targetId: Number
) {
  setInterval(() => clock(startTime, hourInterval, targetType, targetId), 100);
  console.log(`\
Set a Clock: startTime - ${startTime}
             hourInterval - ${hourInterval}
             targetType - ${targetType}
             targetId - ${targetId}`);
  return 1;
}

export async function clock(
  startTime = 0,
  timeInterval = 3,
  targetType: MessageType = "group",
  targetId: Number
) {
  const now = new Date();
  if (
    now.getMilliseconds() < 100 &&
    now.getSeconds() == 0 &&
    now.getMinutes() == 0 &&
    now.getHours() % timeInterval == startTime
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

    const randomPixivImage = await getRandomImageWithPixivFromDB(300);

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

    return sendMessage(targetType, targetId, postMessage).then((result) => {
      console.log(
        `[${now.toLocaleString("zh-CN", {
          hourCycle: "h23",
          dateStyle: "short",
          timeStyle: "medium",
        })}] [CLOCK] send [${targetType}] [${targetId}] [${result?.status}]`
      );
    });
  }
  return 0;
}
