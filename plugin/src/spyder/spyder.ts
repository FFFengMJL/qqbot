import { MessageType, MessageBody, Message } from "./../http/http";
import { getNewsList, New } from "./news";
import fs from "fs";
import { NextFunction } from "express";
import { sendMessage } from "../http/http";

let NewList: Array<New> = [];

interface SpyTime {
  second: Number; // 小于这个时间进行一次爬取
  minute: Number; // 间隔时间
  hour?: Number;
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
      NewList = NewList.concat(newNew);
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
      (!spyTime?.hour || now.getHours() % (spyTime?.hour as number) === 0)
    ) {
      console.log("[spy] start");
      await spy(messageType, targetId, next);
      console.log("[spy] end");
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
发布日期：${news.PublishDate}
`,
      },
    },
  ];
  return await sendMessage(messgeType, targetId, message);
}
