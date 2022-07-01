import axios from "axios";

/**
 * 与图片反代的链接，需要代理
 */
const pixivCat = axios.create({
  proxy: {
    host: "127.0.0.1",
    port: 7890,
  },
  headers: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
  },
  // baseURL: "https://i.pixiv.cat",
  responseType: "arraybuffer",
  timeout: 20000,
});

/**
 * 通过 url 获取图片并转换成 base64 字符串
 * @param url 经过转换的 url，以 https://i.pixiv.cat 域名开头
 * @returns
 */
export async function getPixivImageToBase64(url: string) {
  try {
    console.log(`[PIXIV] url: ${url}`);
    const fileResponse = await pixivCat.get(url);
    console.log(`[PIXIV] pixiv.cat response: ${fileResponse.status}`);
    if (fileResponse.status !== 200) {
      return undefined;
    }

    return `base64://${Buffer.from(fileResponse.data, "binary").toString(
      "base64"
    )}`;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
