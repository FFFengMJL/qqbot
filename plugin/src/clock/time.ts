import {
  getRandomImageWithPixivFromDB,
  getRandomImageWithPixivFromDB_V2,
} from "../pixiv/pixiv";
import { Message, MessageType, sendMessage } from "./../http/http";

/**
 * 发送当前时间
 * @param targetType 私聊和群聊
 * @param targetId 目标id
 * @param message 消息
 */
export async function sendNowTime(targetType: MessageType, targetId: Number) {
  const randomPixivImage = await getRandomImageWithPixivFromDB(300);

  const nowTime: Message = [
    {
      type: "text",
      data: {
        text: `现在时间是：${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
          dateStyle: "full",
          timeStyle: "medium",
        })}`,
      },
    },
  ];

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
    nowTime.push(...randomPixivImageMessage);
  }

  return sendMessage(targetType, targetId, nowTime, false);
}

/**
 * 发送当前时间
 * @param targetType 私聊和群聊
 * @param targetId 目标id
 * @param message 消息
 */
export async function sendNowTime_V2(
  targetType: MessageType,
  targetId: Number
) {
  const randomPixivImage = await getRandomImageWithPixivFromDB_V2(300);

  const nowTime: Message = [
    {
      type: "text",
      data: {
        text: `现在时间是：${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
          dateStyle: "full",
          timeStyle: "medium",
        })}`,
      },
    },
  ];

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
    nowTime.push(...randomPixivImageMessage);
  }

  return sendMessage(targetType, targetId, nowTime, false);
}
