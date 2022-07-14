import { MessageType } from "./http/http";
import express from "express";
import bodyParser from "body-parser";
import * as Time from "./clock/time";
import * as Clock from "./clock/clock";
import * as Spyder from "./spyder/spyder";
import * as Price from "./price/price";
import * as WordCloud from "./wordCloud/wordCloud";

const se = express(); // create a server

se.use(bodyParser.urlencoded({ extended: true }));
se.use(bodyParser.json());

// server
se.post("", (req, rsp) => {
  console.log(req.body.message_type, req.body.raw_message); // 看看具体是啥命令

  // 判断是否是正常的文字消息
  // check message type
  if (
    !req.body.message ||
    !req.body.message[0] ||
    req.body.message[0].type != "text"
  ) {
    rsp.sendStatus(200);
    return;
  }

  // 获取命令
  // get the command
  const messageList: Array<String> = (req.body.message[0].data.text as String)
    .split(" ")
    .filter(Boolean); // split for get command

  // get sender info
  const userId = req.body.user_id;
  const groupId = req.body.group_id;
  const targetType = req.body.message_type as MessageType;
  const targetId = targetType === "group" ? groupId : userId;

  // console.log(req.body);

  // deal with command
  switch (messageList[0]) {
    case "/time": {
      Time.sendNowTime_V2(targetType, targetId);
      break;
    }
    case "/date": {
      Time.sendNowTime(targetType, targetId);
      break;
    }
    case "/price": {
      Price.price(messageList, targetType, targetId);
      break;
    }
    case "/spy": {
      Spyder.spyFF14([{ messageType: targetType, targetId }]);
      break;
    }
    case "/spyPixiv": {
      Spyder.spyPixivRanking("daily", 10);
      break;
    }
    case "/spyPixivBookmark": {
      Spyder.spyRSSHubPixivBookmark(123456798, [
        { messageType: targetType, targetId },
      ]);
      break;
    }
    case "/rankState": {
      WordCloud.sendCurrentWordCloud([{ messageType: targetType, targetId }]);
      break;
    }
    default: {
      break;
    }
  }

  rsp.sendStatus(200);
  return;
});

function main() {
  // launch a server
  const server = se.listen(6700, () => {
    console.log(`Server is start at: `, server.address());
  });

  // 初始化报时时钟并开始任务
  Clock.initClock(
    [
      { targetType: "group", targetId: 123456798 },
      { targetType: "group", targetId: 123456798 },
    ],
    100,
    "0 0 * * * *"
  )?.start();

  // 初始化国服 FF14 官网新闻爬虫并开始任务
  Spyder.initFF14Spyder([
    { messageType: "group", targetId: 123456798 },
    { messageType: "group", targetId: 123456798 },
    { messageType: "group", targetId: 123456789 },
  ])?.start();

  // 初始化 pixiv 日榜爬虫并开始任务
  Spyder.initPixivRankingSpyder()?.start();

  // 初始化 RSSHub 的 pixiv 用户收藏爬虫并开始任务
  Spyder.initRSSHubPixivBookmarkSpyder(123456789, [
    { messageType: "group", targetId: 123456789 },
    { messageType: "group", targetId: 123456789 },
  ])?.start();
}

// 初始化词云定期生成任务
WordCloud.initCronGeneration([
  { messageType: "group", targetId: 123456789 },
  { messageType: "group", targetId: 123456789 },
])?.start();

main();
