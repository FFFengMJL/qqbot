import { spawnSync } from "child_process";
import { format, parse, subDays } from "date-fns";
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
  pythonFilename: string = "wordCloud.py"
) {
  console.log(`[WORDCLOUD] start: 
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
    console.log(error);
    return null;
  }

  const output = python.stdout.toString().slice(0, -1); // 输出带了一个回车需要处理
  console.log(`[WORDCLOUD] end output [${output}]`);

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
async function generateWordCloudWithRankLimit(
  rankDate: string,
  rankLimit: number = 500,
  fontPath: string = "plugin/file/wordCloud/font/sarasa-ui-sc-regular.ttf",
  targetFilePath: string = "plugin/file/wordCloud/image",
  pythonFilePath: string = "plugin/src/wordCloud",
  pythonFilename: string = "wordCloud.py"
) {
  const imageList = await getRankImages(rankDate, rankLimit);

  if (!imageList || !imageList.length) return null;

  const tagList = imageList.map((image) => image.tags);
  const tagString = tagList.join(",");
  const imagePath = generateWordCloudWithText(
    tagString,
    fontPath,
    targetFilePath,
    `${rankDate}_${rankLimit}.png`,
    pythonFilePath,
    pythonFilename
  );

  return imagePath;
}

/**
 * 生成当天的 pixiv 日榜词云图
 * @param rankLimit 排名限制
 * @param fontPath 字体路径
 * @param targetFilePath 目标文件路径
 * @param pythonFilePath python 文件路径
 * @param pythonFilename python 文件名
 * @returns
 */
export async function generateWordCloudWithCurrentPixivRankImage(
  rankLimit: number = 500,
  fontPath: string = "plugin/file/wordCloud/font/sarasa-ui-sc-regular.ttf",
  targetFilePath: string = "plugin/file/wordCloud/image",
  pythonFilePath: string = "plugin/src/wordCloud",
  pythonFilename: string = "wordCloud.py"
) {
  const now = new Date();
  let rankDate;
  if (now.getHours() < 13) {
    rankDate = format(subDays(now, 2), "yyyyMMdd");
  } else {
    rankDate = format(subDays(now, 1), "yyyyMMdd");
  }

  const imagePath = await generateWordCloudWithRankLimit(
    rankDate,
    rankLimit,
    fontPath,
    targetFilePath,
    pythonFilePath,
    pythonFilename
  );

  if (!imagePath) return null;

  return { rankDate, imagePath } as WordCloudGenerationResult;
}

export async function getWordCloudWithCurrentRankImage(
  rankLimit: number = 500,
  targetFilePath: string = "plugin/file/wordCloud/image"
) {
  const now = new Date();
  let targetDate;
  if (now.getHours() < 13) {
    targetDate = subDays(now, 2);
  } else {
    targetDate = subDays(now, 1);
  }
  const rankDate = format(targetDate, "yyyyMMdd");

  const imagePath = `${targetFilePath}/${rankDate}_${rankLimit}.png`;

  // 判断文件是否存在
  let fileAccessed;
  try {
    accessSync(imagePath, constants.F_OK);
    fileAccessed = true;
  } catch (error) {
    fileAccessed = false;
  }

  if (!fileAccessed) {
    return await generateWordCloudWithCurrentPixivRankImage(
      rankLimit,
      undefined,
      targetFilePath
    );
  }

  return {
    rankDate,
    imagePath,
  } as WordCloudGenerationResult;
}

/**
 * 发送最近的词云图给目标列表
 * @param rankLimit
 * @param targetList
 * @returns
 */
export async function sendCurrentWordCloud(
  targetList: TargetList,
  rankLimit: number = 500
) {
  const wordCloud = await getWordCloudWithCurrentRankImage(rankLimit);
  if (!wordCloud) return wordCloud;

  const rankDate = parse(wordCloud.rankDate, "yyyyMMdd", new Date());
  const message: Message = [
    {
      type: "text",
      data: {
        text: `${format(
          rankDate,
          "yyyy年MM月dd日"
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

  targetList.forEach(({ messageType, targetId }) => {
    console.log(`[WORD_CLOUD] sendTo [${messageType}] [${targetId}]`);
    return sendMessage(messageType, targetId, message);
  });

  return wordCloud;
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
  rankLimit: number = 500
) {
  try {
    console.log(`[INIT] [WORD_CLOUD] set a cronJob [${cronTime}]`);
    return new CronJob(cronTime, async () => {
      console.log(
        `[${format(
          new Date(),
          "yyyy-MM-dd HH:mm:ss"
        )}] [WORD_CLOUD] [PIXIV] start`
      );

      await sendCurrentWordCloud(targetList, rankLimit);

      console.log(
        `[${format(
          new Date(),
          "yyyy-MM-dd HH:mm:ss"
        )}] [WORD_CLOUD] [PIXIV] end`
      );
    });
  } catch (error) {
    console.log(error);
    return null;
  }
}
