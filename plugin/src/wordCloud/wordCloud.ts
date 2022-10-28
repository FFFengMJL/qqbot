import { spawnSync } from "child_process";
import dayjs from "dayjs";
import { accessSync, constants } from "fs";
import { Message, sendMessage, TargetList } from "../http/http";
import { getRankImages } from "../pixiv/pixiv";
import { WordCloudGenerationResult } from "./wordCloud.type";
import { DateTime } from "luxon";
import { CronJob } from "cron";

/**
 * 通过给定的文本生成对应的词云
 * @param text 文本
 * @param fontPath 字体路径
 * @param targetFilePath 生成的文件的文件夹
 * @param targetFilename 生成的文件的名字
 * @param pythonFilePath python 文件所在的文件夹
 * @param pythonFilename python 文件文件名
 * @returns 如果出错，在命令行输出错误并返回 null，否则返回生成的文件路径
 */
export function generateWordCloudWithText(
  text: string,
  fontPath: string = "plugin/file/wordCloud/font/sarasa-ui-sc-regular.ttf",
  targetFilePath: string = "plugin/file/wordCloud/image",
  targetFilename: string = "tmp.png",
  pythonFilePath: string = "plugin/src/wordCloud",
  pythonFilename: string = "wordCloud.py",
) {
  console.log(`[WORD_CLOUD] start: 
  pythonFile [${pythonFilePath}/${pythonFilename}]
  targetFile [${targetFilePath}/${targetFilename}]
  font [${fontPath}]
  textLength [${text.length}]`);

  const python = spawnSync("python3", [
    `${pythonFilePath}/${pythonFilename}`,
    `${targetFilePath}/${targetFilename}`,
    fontPath,
    text,
  ]);
  const error = python.stderr.toString();

  if (error) {
    throw new Error(error);
  }

  const output = python.stdout.toString().slice(0, -1); // 输出带了一个回车需要处理
  console.log(`[WORD_CLOUD] end output [${output}]`);

  return output;
}

/**
 * 根据相关限制生成对应的词云图
 * @param rankDate 排行榜日期
 * @param rankLimit 排名限制
 * @param fontPath 字体路径
 * @param targetFilePath 目标文件路径
 * @param pythonFilePath python 文件路径
 * @param pythonFilename python 文件名
 * @returns
 */
async function generateWordCloudWithPixivRankImage(
  rankDate: string,
  rankLimit: number = 500,
  fontPath: string = "plugin/file/wordCloud/font/sarasa-ui-sc-regular.ttf",
  targetFilePath: string = "plugin/file/wordCloud/image",
  pythonFilePath: string = "plugin/src/wordCloud",
  pythonFilename: string = "wordCloud.py",
) {
  const imageList = await getRankImages(rankDate, rankLimit);

  if (!imageList || !imageList.length) return null;

  const tagString = imageList.map((image) => image.tags).join(",");
  const imagePath = generateWordCloudWithText(
    tagString,
    fontPath,
    targetFilePath,
    `${rankDate}_${rankLimit}.png`,
    pythonFilePath,
    pythonFilename,
  );

  return imagePath;
}

/**
 * 获取当天的日榜词云
 * @param rankLimit 排名限制
 * @param targetFilePath 目标文件路径
 * @returns
 */
export async function getWordCloudWithRankImage(
  rankDate: string,
  rankLimit: number = 500,
  targetFilePath: string = "plugin/file/wordCloud/image",
) {
  const imagePath = `${targetFilePath}/${rankDate}_${rankLimit}.png`;

  // 判断文件是否存在
  try {
    accessSync(imagePath, constants.F_OK);
    // 如果文件存在，直接返回
    return {
      rankDate,
      imagePath,
    } as WordCloudGenerationResult;
  } catch (error) {
    // 文件不存在，进行生成
    console.log(`[WORD_CLOUD] ${imagePath} not exist, generating`);
    const wordCloudImage = await generateWordCloudWithPixivRankImage(
      rankDate,
      rankLimit,
      undefined,
      targetFilePath,
    );

    if (!wordCloudImage) return null;

    return {
      imagePath: wordCloudImage,
      rankDate,
    } as WordCloudGenerationResult;
  }
}

/**
 * 发送最近的词云图给目标列表
 * @param rankLimit
 * @param targetList
 * @returns
 */
export async function sendCurrentWordCloud(
  targetList: TargetList,
  rankLimit: number = 500,
) {
  let message: Message = [];

  try {
    const now = dayjs();
    let rankDateString = now.subtract(1, "day").format("YYYYMMDD");
    let wordCloud = await getWordCloudWithRankImage(rankDateString, rankLimit);

    if (!wordCloud) {
      rankDateString = now.subtract(2, "day").format("YYYYMMDD");
      wordCloud = await getWordCloudWithRankImage(rankDateString, rankLimit);
    }

    if (!wordCloud) return null;

    message = [
      {
        type: "text",
        data: {
          text: `${now.format(
            "YYYY年M月D日",
          )} 的前 ${rankLimit} 名作品词云为：\n`,
        },
      },
      {
        type: "image",
        data: {
          file: `file://${process.cwd()}/${wordCloud.imagePath}`,
          c: 3,
        },
      },
    ];
  } catch (error) {
    console.error(error);
    message = [
      {
        type: "text",
        data: { text: "获取词云图片出错" },
      },
    ];
  }

  // 发送消息
  targetList.forEach(({ messageType, targetId }) => {
    console.log(`[WORD_CLOUD] sendTo [${messageType}] [${targetId}]`);
    return sendMessage(messageType, targetId, message);
  });

  return message.length;
}

/**
 * 初始化定时任务
 * @param targetList 目标列表
 * @param cronTime 定时时间
 * @param rankLimit 排名
 * @returns
 */
export function initCronGeneration(
  targetList: TargetList,
  cronTime: string | Date | DateTime = "0 0 13 * * *",
  rankLimit: number = 500,
) {
  try {
    console.log(`[INIT] [WORD_CLOUD] set a cronJob [${cronTime}]`);
    return new CronJob(cronTime, async () => {
      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss:SSS",
        )}] [WORD_CLOUD] [PIXIV] start`,
      );

      await sendCurrentWordCloud(targetList, rankLimit);

      console.log(
        `[${dayjs().format(
          "YYYY-MM-DD HH:mm:ss:SSS",
        )}] [WORD_CLOUD] [PIXIV] end`,
      );
    });
  } catch (error) {
    console.error(arguments);
    console.error(error);
    return undefined;
  }
}
