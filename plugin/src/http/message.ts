type CQCodeType =
  | "face"
  | "text"
  | "image"
  | "record"
  | "video"
  | "at"
  | "rps"
  | "dice"
  | "shake"
  | "poke"
  | "anonymous"
  | "share"
  | "contact"
  | "location"
  | "music"
  | "reply"
  | "forward"
  | "node"
  | "xml"
  | "json";

interface CQText {
  type: CQCodeType;
  data: {
    text: String;
  };
}

interface CQFace {
  type: CQCodeType;
  data: {
    id: Number;
  };
}

interface CQImage {
  type: CQCodeType;
  data: {
    file: String;
    flash?: "flash";
    url?: String;
    cache?: 0 | 1;
    proxy?: 0 | 1;
    time?: Number;
  };
}

interface CQRecord {
  type: CQCodeType;
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
  type: CQCodeType;
  data: {
    file: String;
    url?: String;
    cache?: 0 | 1;
    proxy?: 0 | 1;
    time?: Number;
  };
}

interface CQAt {
  type: CQCodeType;
  data: {
    qq: Number;
  };
}

interface CQRps {
  type: CQCodeType;
  data: {};
}

interface CQDice {
  type: CQCodeType;
  data: {};
}

export type CQCode =
  | CQText
  | CQFace
  | CQAt
  | CQDice
  | CQImage
  | CQRecord
  | CQRps
  | CQVideo;
