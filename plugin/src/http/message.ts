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

interface CQImage {
  type: "image";
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

export type CQCode =
  | CQText
  | CQFace
  | CQAt
  | CQDice
  | CQImage
  | CQRecord
  | CQRps
  | CQVideo;

type CQCodeType = CQCode["type"];
