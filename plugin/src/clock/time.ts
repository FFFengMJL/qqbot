import { getRandomImageWithPixivic } from "../pixiv/mirror";
import { Message, MessageType, sendMessage } from "./../http/http";

/**
 * 发送当前时间
 * @param targetType 私聊和群聊
 * @param targetId 目标id
 * @param message 消息
 */
export async function sendNowTime(targetType: MessageType, targetId: Number) {
  const randomPixivImage = await getRandomImageWithPixivic();

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

  if (randomPixivImage !== null) {
    nowTime.push({
      type: "image",
      data: {
        file: randomPixivImage,
        c: 3,
      },
    });
  }

  return sendMessage(targetType, targetId, nowTime, false);
}
