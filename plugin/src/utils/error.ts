import { AxiosError } from "axios";
import dayjs from "dayjs";
import { size } from "lodash";

export function logError(error: Error | AxiosError | unknown) {
  const nowString = `[${dayjs().format("YYYY-MM-DD HH:mm:ss:SSS")}]`;
  const axiosError = error as AxiosError;
  if (axiosError.response) {
    // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
    // console.log(error.response.data);
    console.error(
      `${nowString} [ERROR] [response] status`,
      axiosError.response.status,
    );
    console.error(
      `${nowString} [ERROR] [response] headers`,
      axiosError.response.headers,
    );
  }

  if (axiosError.request) {
    // 请求已经成功发起，但没有收到响应
    // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
    // 而在node.js中是 http.ClientRequest 的实例
    console.error(`${nowString} [ERROR] [request] `, size(axiosError.request));
  }

  if (axiosError.config) {
    console.error(`${nowString} [ERROR] [config]`, axiosError.config);
  }

  // error 正常信息
  console.error(
    `${nowString} [Error] [message]`,
    (error as Error).message ?? error,
  );
  return undefined;
}
