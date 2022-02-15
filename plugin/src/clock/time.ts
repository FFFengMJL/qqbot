import { CQCode } from "./../http/message";
import { MessageType } from "./../http/http";
import { sendMessage } from "../http/http";

/**
 * 发送当前时间
 * @param targetType 私聊和群聊
 * @param targetId 目标id
 * @param message 消息
 */
export function sendNowTime(
  targetType: MessageType = "group",
  targetId: Number
) {
  const now = new Date();
  const nowTime: CQCode = {
    type: "text",
    data: {
      text: `现在时间是：${now.toLocaleString("zh-CN", {
        hourCycle: "h23",
        dateStyle: "full",
        timeStyle: "medium",
      })}`,
    },
  };

  return sendMessage(targetType, targetId, [nowTime], false);
}
