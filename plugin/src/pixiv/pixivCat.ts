import axios, { AxiosResponse } from "axios";

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

    return `base64://${Buffer.from(fileResponse.data, "binary").toString(
      "base64"
    )}`;
  } catch (error: any) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
      // 而在node.js中是 http.ClientRequest 的实例
      console.log(error.request);
    } else {
      // 发送请求时出了点问题
      console.log("Error", error.message);
    }
    console.log(error.config);

    return undefined;
  }
}
