import { Message, MessageType, sendMessage } from "../http/http";
import { getCurrentlyShownById, isWorldOrDC, WorldOrDC } from "./universalis";
import { searchTradableItemFromXIVAPIByName } from "./xivapi";
import dayjs from "dayjs";

export async function getPrice(
  targetType: MessageType,
  targetId: Number,
  itemString: String,
  worldOrDC: WorldOrDC = "猫小胖",
) {
  try {
    console.log(
      `[${dayjs().format(
        "YYYY-MM-DD HH:mm:ss:SSS",
      )}] [PRICE] search [${itemString}] in [${worldOrDC}]`,
    );
    const itemSearchResponse = await searchTradableItemFromXIVAPIByName(
      itemString,
    );

    console.log(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}]  [PRICE] get [${
        itemSearchResponse.Pagination.ResultsTotal
      }] results about [${itemString}]`,
    );

    if (itemSearchResponse.Pagination.ResultsTotal === 0) {
      return sendMessage(
        targetType,
        targetId,
        "没有对应的物品，请重新输入",
        false,
      );
    } else if (itemSearchResponse.Pagination.ResultsTotal > 5) {
      let itemList = itemSearchResponse.Results.map((item) => item.Name).join(
        "\n",
      );

      return sendMessage(
        targetType,
        targetId,
        `搜索到多个物品，请确认：\n${itemList}`,
        false,
      );
    } else {
      const currentlyShown = await getCurrentlyShownById(
        itemSearchResponse.Results[0].ID,
        worldOrDC,
      );

      const onsaleList = currentlyShown.listings
        .map((item) => {
          return `${item.pricePerUnit} * ${item.quantity} = ${item.total}${
            item.hq ? " hq" : ""
          }\t${item.retainerName}${
            item?.worldName ? `(${item.worldName})` : ""
          }`;
        })
        .join("\n");

      const history = currentlyShown.recentHistory
        .map((item) => {
          return `${item.pricePerUnit} * ${item.quantity} = ${item.total}${
            item.hq ? " hq" : ""
          }\t${item.buyerName}${
            item?.worldName ? `(${item.worldName})` : ""
          } [${new Date((item.timestamp as number) * 1000).toLocaleString(
            "zh-cn",
            {
              hourCycle: "h23",
              timeStyle: "short",
              dateStyle: "short",
            },
          )}]`;
        })
        .join("\n");

      let itemList = itemSearchResponse.Results.map((item) => item.Name).join(
        "\n",
      );
      const warning = `搜索到 ${itemSearchResponse.Pagination.PageTotal} 个物品，默认使用选择第 1 个：\n${itemList}\n\n`;

      const message: Message = [
        {
          type: "text",
          data: {
            text: `${warning}正在出售：\n${onsaleList}\n\n最近售出：\n${history}`,
          },
        },
      ];

      console.log(
        `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}] [PRICE] get [${
          currentlyShown.listings.length
        }] onsales and [${
          currentlyShown.recentHistory.length
        }] history about [${
          itemSearchResponse.Results[0].Name
        }] in [${worldOrDC}]`,
      );

      return sendMessage(targetType, targetId, message);
    }
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export function price(
  messageList: Array<String>,
  targetType: MessageType,
  targetId: Number,
) {
  if (messageList.length < 2) {
    sendMessage(
      targetType,
      targetId,
      "/price 物品名 大区/服务器完整名称（默认猫区）",
      false,
    );
  } else if (messageList.length == 2) {
    getPrice(targetType, targetId, messageList[1]);
  } else if (messageList.length >= 3 && !isWorldOrDC(messageList[2])) {
    sendMessage(targetType, targetId, `不存在 ${messageList[2]} 大区`, false);
  } else {
    getPrice(targetType, targetId, messageList[1], messageList[2] as WorldOrDC);
  }
}
