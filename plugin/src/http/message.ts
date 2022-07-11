interface CQText {
  type: "text";
  data: {
    text: String;
  };
}

interface CQFace {
  type: "face";
  data: {
    id: Number;
  };
}

enum CQImageEffects {
  普通 = 40000,
  幻影,
  抖动,
  生日,
  爱你,
  征友,
}

enum CQImageSubType {
  正常图片 = 0,
  "表情包, 在客户端会被分类到表情包图片并缩放显示",
  热图,
  斗图,
  "智图?",
  贴图 = 7,
  自拍,
  "贴图广告?",
  有待测试,
  热搜图 = 13,
}

interface CQImage {
  type: "image";
  data: {
    file?: String;
    type?: "flash" | "show";
    url?: String;
    cache?: 0 | 1;
    subType?: CQImageSubType;
    c?: 2 | 3;
    id?: CQImageEffects;
  };
}

interface CQRecord {
  type: "record";
  data: {
    file: String;
    magic?: 0 | 1;
    url?: String;
    cache?: 0 | 1;
    proxy?: 0 | 1;
    time?: Number;
  };
}

interface CQVideo {
  type: "video";
  data: {
    file: String;
    url?: String;
    cache?: 0 | 1;
    proxy?: 0 | 1;
    time?: Number;
  };
}

interface CQAt {
  type: "at";
  data: {
    qq: Number;
  };
}

interface CQRps {
  type: "rps";
  data: {};
}

interface CQDice {
  type: "dice";
  data: {};
}

interface CQShake {
  type: "shake";
  data: {};
}

interface CQAnonymous {
  type: "anonymous";
  data: {};
}

interface CQLinkShare {
  type: "share";
  data: {
    url: String;
    title: String;
  };
}

interface CQLocation {
  type: "location";
  data: {
    lat: Number;
    lon: Number;
  };
}

interface CQMusic {
  type: "music";
  data: {
    type: "qq" | "163" | "xm";
    id: String;
  };
}

interface CQMusicCutsom {
  type: "music";
  data: {
    type: "custom";
    url: String;
    audio: String;
    title: String;
    content?: String;
    image?: String;
  };
}

interface CQReply {
  type: "reply";
  data: {
    id: Number;
    text?: String;
    qq?: Number;
    time?: Number;
    seq?: Number;
  };
}

interface CQRedbag {
  type: "redbag";
  data: {
    title: String;
  };
}

interface CQPoke {
  type: "poke";
  data: {
    qq: Number;
  };
}

enum CQGiftId {
  甜Wink,
  快乐肥宅水,
  幸运手链,
  卡布奇诺,
  猫咪手表,
  绒绒手套,
  彩虹糖果,
  坚强,
  告白话筒,
  牵你的手,
  可爱猫咪,
  神秘面具,
  我超忙的,
  爱心口罩,
}

interface CQGift {
  type: "gift";
  data: {
    qq: Number;
    id: CQGiftId; // 0 - 13
  };
}

interface CQForward {
  type: "forward";
  data: {
    id: String;
  };
}

interface CQNode {
  type: "node";
  data: {
    id: Number;
    name?: String;
    uin?: String;
    content?: String;
    seq?: String;
  };
}

interface CQXml {
  type: "xml";
  data: {
    data: String;
    resid?: Number;
  };
}

interface CQJson {
  type: "json";
  data: {
    data: String;
    resid?: Number;
  };
}

interface CQCardImage {
  type: "cardimage";
  data: {
    file: String;
    minwidth: Number;
    minheight: Number;
    maxwidth: Number;
    maxheight: Number;
    source: String;
    icon: String;
  };
}

interface CQTTS {
  type: "tts";
  data: {
    text: String;
  };
}

export type CQCode =
  | CQAnonymous
  | CQAt
  | CQCardImage
  | CQDice
  | CQFace
  | CQForward
  | CQGift
  | CQImage
  | CQJson
  | CQLinkShare
  | CQLocation
  | CQMusic
  | CQMusicCutsom
  | CQNode
  | CQPoke
  | CQPoke
  | CQRecord
  | CQRedbag
  | CQReply
  | CQRps
  | CQShake
  | CQTTS
  | CQText
  | CQVideo
  | CQXml;

type CQCodeType = CQCode["type"];
