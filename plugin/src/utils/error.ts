export function logError(error: any) {
  if (error.response) {
    // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
    // console.log(error.response.data);
    console.log("[ERROR] response status", error.response.status);
    console.log("[ERROR] response headers", error.response.headers);
  } else if (error.request) {
    // 请求已经成功发起，但没有收到响应
    // `error.request` 在浏览器中是 XMLHttpRequest 的实例，
    // 而在node.js中是 http.ClientRequest 的实例
    console.log("[ERROR] request ", error.request);
  } else {
    // 发送请求时出了点问题
    console.log("[Error] message", error.message);
  }
  console.log("[ERROR] config", error.config);
  return undefined;
}
