import { MessageType, Message } from "./../http/http";
import { getNewsList, New } from "./news";
import fs from "fs";
import { sendMessage } from "../http/http";

let NewList: Array<New> = [];

interface SpyTime {
  second: Number; // 小于这个时间进行一次爬取
  minute: Number; // 间隔时间
  hour?: Number;
  startHour?: Number;
  endHour?: Number;
}

async function spy(
  messageType: MessageType,
  targetId: Number,
  next?: Function
) {
  try {
    const newList = (await getNewsList()).Data;
    const newNew: Array<New> = [];

    for (let item of newList) {
      if (!NewList.some((value) => value.Id === item.Id)) {
        newNew.push(item);
        sendNews(messageType, targetId, item);
      }
    }

    if (newNew.length) {
      NewList = newNew.concat(NewList);
      fs.writeFileSync("./news.json", JSON.stringify(NewList));
      console.log(
        `[spy]\tget ${newNew.length} news, now has ${NewList.length} news`
      );
    }
  } catch (err) {
    console.log(err);
  }
}

export async function initSpyder(
  messageType: MessageType,
  targetId: Number,
  spyTime: SpyTime = {
    second: 10,
    minute: 10,
  },
  next?: Function
) {
  NewList = JSON.parse(fs.readFileSync("./news.json").toString());
  setInterval(async () => {
    const now = new Date();
    if (
      now.getSeconds() <= spyTime.second &&
      now.getMinutes() % (spyTime.minute as number) === 0 &&
      (!spyTime?.hour || now.getHours() % (spyTime?.hour as number) === 0) && // 不存在间隔小时 或者 存在间隔小时并满足间隔
      (!(spyTime?.startHour && spyTime?.endHour) || // 两者都有的反
        (now.getHours() >= (spyTime?.startHour as number) && // 两者都存在并满足
          now.getHours() <= (spyTime?.endHour as number)))
    ) {
      console.log(
        `[${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
        })}] [spy] start`
      );

      await spy(messageType, targetId, next);
      console.log(
        `[${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
        })}] [spy] end`
      );
    }
  }, (spyTime.second as number) * 1000);
}

export async function sendNews(
  messgeType: MessageType,
  targetId: Number,
  news: New
) {
  const message: Message = [
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
