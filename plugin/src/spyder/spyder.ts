import { MessageType, Message, sendMessage } from "./../http/http";
import { getNewsList } from "./news";
import fs from "fs";
import { New } from "./news.type";
import { SpyTime } from "./spyder.type";

let NewList: Array<New> = [];

export async function spy(
  messageType: MessageType,
  targetId: Number,
  next?: Function
) {
  try {
    const currentNews = (await getNewsList()).Data;
    const unaddedNew: Array<New> = [];

    console.log(`[SPYDER] currentNews: ${currentNews.length}`);

    for (let item of currentNews) {
      if (
        !NewList.some(
          (value) =>
            value.Id === item.Id && value.PublishDate === item.PublishDate
        )
      ) {
        unaddedNew.push(item);
        sendNews(messageType, targetId, item);
      }
    }

    console.log(`[SPYDER] unaddedNews: ${unaddedNew}`);

    if (unaddedNew.length) {
      NewList = unaddedNew.concat(NewList);
      fs.writeFileSync("./news.json", JSON.stringify(NewList, null, "  "));
      console.log(
        `[SPYDER] get ${unaddedNew.length} news, now has ${NewList.length} news`
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
    minute: 5,
  },
  next?: Function
) {
  NewList = JSON.parse(fs.readFileSync("./news.json").toString());
  setInterval(async () => {
    const now = new Date();
    if (
      now.getSeconds() <= spyTime.second &&
      now.getMinutes() % spyTime.minute === 0 &&
      (!spyTime?.hour || now.getHours() % spyTime?.hour === 0) && // 不存在间隔小时 或者 存在间隔小时并满足间隔
      (!(spyTime?.startHour && spyTime?.endHour) || // 两者都有的反
        (now.getHours() >= spyTime?.startHour && // 两者都存在并满足
          now.getHours() <= spyTime?.endHour))
    ) {
      console.log(
        `[${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
        })}] [SPYDER] start`
      );

      await spy(messageType, targetId, next);
      console.log(
        `[${new Date().toLocaleString("zh-CN", {
          hourCycle: "h23",
        })}] [SPYDER] end`
      );
    }
  }, spyTime.second * 1000);
}

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
