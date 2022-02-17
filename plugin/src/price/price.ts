import { Message, MessageType } from "./../http/http";
import { sendMessage } from "../http/http";
import { getCurrentlyShownById, WorldOrDC } from "./universalis";
import { searchItemFromXIVAPIByName } from "./xivapi";
export async function getPrice(
  targetType: MessageType,
  targetId: Number,
  itemString: String,
  worldOrDC: WorldOrDC = "猫小胖"
) {
  try {
    console.log(
      `[${new Date().toLocaleString("zh-cn", {
        hourCycle: "h23",
        timeStyle: "medium",
        dateStyle: "medium",
      })}] [PRICE] search [${itemString}] in [${worldOrDC}]`
    );
    const itemSearchResponse = await searchItemFromXIVAPIByName(itemString);

    if (itemSearchResponse.Pagination.ResultsTotal === 0) {
      return sendMessage(
        targetType,
        targetId,
        "没有对应的物品，请重新输入",
        false
      );
    } else if (itemSearchResponse.Pagination.ResultsTotal > 2) {
      let itemList = itemSearchResponse.Results.map((item) => item.Name).join(
        "\n"
      );

      return sendMessage(
        targetType,
        targetId,
        `搜索到多个物品，请确认：\n${itemList}`,
        false
      );
    } else {
      const currentlyShown = await getCurrentlyShownById(
        itemSearchResponse.Results[0].ID,
        worldOrDC
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
          }\t${item.buyerName}${item?.worldName ? `(${item.worldName})` : ""}`;
        })
        .join("\n");

      let warning = "";
      if (itemSearchResponse.Pagination.ResultsTotal == 2) {
        let itemList = itemSearchResponse.Results.map((item) => item.Name).join(
          "\n"
        );
        warning = `搜索到 2 个物品，默认使用选择第 1 个：\n${itemList}\n\n`;
      }

      const message: Message = [
        {
          type: "text",
          data: {
            text: `${warning}正在出售：\n${onsaleList}\n\n最近售出：\n${history}`,
          },
        },
      ];

      return sendMessage(targetType, targetId, message);
    }
  } catch (err) {
    console.log(err);
  }
}
