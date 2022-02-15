import { MessageType } from "./../http/http";
import { MessageBody, sendMessage, MessageTypeO } from "../http/http";
import { CQCode } from "../http/message";

/**
 * 整点报时闹钟
 * @param {number} startTime
 * @param {number} timeInterval
 * @param {number} targetType
 * @param {number} targetId
 */
export function initClock(
  startTime = 0,
  timeInterval = 3,
  targetType: MessageType = "group",
  targetId: Number
) {
  setInterval(() => clock(startTime, timeInterval, targetType, targetId), 100);
  console.log(`\
Set a Clock: startTime - ${startTime}
             timeInterval - ${timeInterval}
             targetType - ${targetType}
             targetId - ${targetId}`);
  return 1;
}

export function clock(
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
    const postMessage: Array<CQCode> = [
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

    return sendMessage(targetType, targetId, postMessage, false).then(
      (result) => {
        console.log("clocked", result);
      }
    );
  }
  return 0;
}
