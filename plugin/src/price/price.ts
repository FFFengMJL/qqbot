import { Message, MessageType, sendMessage } from "../http/http";
import { getCurrentlyShownById, WorldOrDC } from "./universalis";
import { searchTradableItemFromXIVAPIByName } from "./xivapi";
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
        dateStyle: "short",
      })}] [PRICE] search [${itemString}] in [${worldOrDC}]`
    );
    const itemSearchResponse = await searchTradableItemFromXIVAPIByName(
      itemString
    );

    console.log(
      `[${new Date().toLocaleString("zh-cn", {
        hourCycle: "h23",
        timeStyle: "medium",
        dateStyle: "short",
      })}] [PRICE] get [${
        itemSearchResponse.Pagination.ResultsTotal
      }] results about [${itemString}]`
    );

    if (itemSearchResponse.Pagination.ResultsTotal === 0) {
      return sendMessage(
        targetType,
        targetId,
        "没有对应的物品，请重新输入",
        false
      );
    } else if (itemSearchResponse.Pagination.ResultsTotal > 5) {
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
          }\t${item.buyerName}${
            item?.worldName ? `(${item.worldName})` : ""
          } [${new Date((item.timestamp as number) * 1000).toLocaleString(
            "zh-cn",
            {
              hourCycle: "h23",
              timeStyle: "short",
              dateStyle: "short",
            }
          )}]`;
        })
        .join("\n");

      let itemList = itemSearchResponse.Results.map((item) => item.Name).join(
        "\n"
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
        `[${new Date().toLocaleString("zh-cn", {
          hourCycle: "h23",
          timeStyle: "medium",
          dateStyle: "short",
        })}] [PRICE] get [${currentlyShown.listings.length}] onsales and [${
          currentlyShown.recentHistory.length
        }] history about [${
          itemSearchResponse.Results[0].Name
        }] in [${worldOrDC}]`
      );

      return sendMessage(targetType, targetId, message);
    }
  } catch (err) {
    console.log(err);
  }
}
