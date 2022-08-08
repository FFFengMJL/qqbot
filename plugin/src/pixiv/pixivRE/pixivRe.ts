import { PrismaClient } from "@prisma/client";

const PixivDBClient = {
  pixivRankingImage: new PrismaClient().pixivRankingImage,
  pixivArtwork: new PrismaClient().pixivArtwork,
};

/**
 * 把原图链接转换为 pixiv.re 的直达链接
 * @param url i.pximg.net/pixiv.rsshub.app 等前缀，后面类似 /img-original/img/2022/08/07/23/38/17/100313331_p0.png 的链接
 * @returns
 */
export function fileURL2PixivReURL(url: string) {
  const [filename] = url.split("/").slice(-1); // ${illustId}_p${num}.jpg/png
  const [illustId_p, fileType] = filename.split(".");
  const [illustId] = illustId_p.split("_");
  return `https://pixiv.re/${illustId}.${fileType}`;
}
