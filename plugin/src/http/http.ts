import axios from "axios";
import { logError } from "../utils/error";
import { CQCode } from "./message";

const BOT_HTTP_SERVER = {
  HOST: "http://127.0.0.1",
  PORT: 5700,
};

export type TargetList = Array<{ messageType: MessageType; targetId: number }>;

/**
 * 消息类型
 */
export type Message = Array<CQCode> | String;

/**
 * 发送消息后的响应数据
 */
interface MessageResponseData {
  message_id: Number;
}

/**
 * 发送消息后的响应
 */
export interface MessageResponse {
  data: MessageResponseData | null;
  retcode: Number;
  status: String;
  msg?: String;
  wording?: String;
}

interface BasicMessageBody {
  message: Message; // 消息
  auto_escape: Boolean; // 消息内容是否作为纯文本发送 ( 即不解析 CQ 码 ) , 只在 message 字段是字符串时有效
}

export type MessageType = "private" | "group";

export type MessageBody = PrivateMessageBody | GroupMessageBody;

/**
 * 私聊消息
 */
type PrivateMessageBody = BasicMessageBody & {
  user_id: Number; // qq 号
  group_id?: Number; // 主动发起临时会话群号(机器人本身必须是管理员/群主)
};

/**
 * 群发消息
 */
type GroupMessageBody = BasicMessageBody & {
  group_id: Number; // 群号
};

/**
 * 发送私聊消息
 * @param userId 群号
 * @param message 消息
 */
export async function sendPrivateMessage(body: PrivateMessageBody) {
  try {
    const response = await axios.post(
      `${BOT_HTTP_SERVER.HOST}:${BOT_HTTP_SERVER.PORT}/send_private_msg`,
      body,
      {
        timeout: 60000,
        maxBodyLength: 30000000,
      },
    );

    return response.data as MessageResponse;
  } catch (error) {
    return logError(error);
  }
}

export async function sendGroupMessage(body: GroupMessageBody) {
  try {
    const response = await axios.post(
      `${BOT_HTTP_SERVER.HOST}:${BOT_HTTP_SERVER.PORT}/send_group_msg`,
      body,
      {
        timeout: 60000,
        maxBodyLength: 30000000,
      },
    );

    return response.data as MessageResponse;
  } catch (error) {
    return logError(error);
  }
}

export async function sendMessage(
  messageType: MessageType,
  targetId: Number,
  message: Message,
  auto_escape: Boolean = false,
) {
  if (messageType === "private") {
    return await sendPrivateMessage({
      message,
      user_id: targetId,
      auto_escape,
    });
  } else if (messageType === "group") {
    return await sendGroupMessage({
      message,
      group_id: targetId,
      auto_escape,
    });
  } else {
    return null;
  }
}
