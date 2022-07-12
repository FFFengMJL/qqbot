import axios, { AxiosResponse } from "axios";
import { format } from "date-fns";
import { logError } from "../utils/error";

/**
 * 与图片反代的链接，需要代理
 */
const pixivCat = axios.create({
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  // baseURL: "https://i.pixiv.cat",
  responseType: "arraybuffer",
  timeout: 20000,
});

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 未经过转换的 url，以 https://i.pixiv.net 域名开头
 * @returns
 */
export async function getPixivImageToBase64FromPixivCat(url: string) {
  try {
    const pixivCatUrl = url.replace("i.pximg.net", "i.pixiv.re");
    console.log(`[PIXIV] url: ${pixivCatUrl}`);
    const fileResponse = await pixivCat.get(pixivCatUrl);
    console.log(
      `[PIXIV] pixiv.cat response: ${fileResponse.status} ${fileResponse.data.length}`
    );
    if (fileResponse.status !== 200) {
      return undefined;
    }

    console.log(
      `[PIXIV] [BASE64] start [${format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss:SSS"
      )}]`
    );

    return `base64://${Buffer.from(fileResponse.data, "binary").toString(
      "base64"
    )}`;
  } catch (error: any) {
    return logError(error);
  }
}

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 图片的 url，以 https://i.pximg.net 域名开头
 * @returns
 */
export async function getPixivImageBufferFromPixivCat(url: string) {
  try {
    const pixivCatUrl = url.replace("i.pximg.net", "i.pixiv.re");
    console.log(`[PIXIV] url: ${pixivCatUrl}`);
    const fileResponse = await pixivCat.get(pixivCatUrl);
    console.log(
      `[PIXIV] pixiv.cat response: ${fileResponse.status} ${fileResponse.data.length}`
    );
    if (fileResponse.status !== 200) {
      return undefined;
    }

    console.log(
      `[PIXIV] [BUFFER] start [${format(
        new Date(),
        "yyyy-MM-dd HH:mm:ss:SSS"
      )}]`
    );

    return Buffer.from(fileResponse.data, "binary");
  } catch (error: any) {
    return logError(error);
  }
}
