import axios from "axios";

const XIVAPI_CN = "https://cafemaker.wakingsands.com";
const XIVAPI = "https://xivapi.com";

interface Pagination {
  Page: Number;
  PageNext: Number | null;
  PagePrev: Number | null;
  PageTotal: Number;
  Results: Number;
  ResultsPerPage: Number;
  ResultsTotal: Number;
}

interface Item {
  ID: Number;
  Icon: String;
  Name: String;
  Url: String;
  UrlType: String;
  _: String;
  _Score: String;
}

interface XIVAPISearchResponse {
  Pagination: Pagination;
  Results: Array<Item>;
  SpeedMs: Number;
}

export async function searchItemFromXIVAPIByName(
  itemString: String,
  limit: Number = 10
) {
  const url = `${XIVAPI_CN}/search?indexes=Item&string=${encodeURI(
    itemString.toString()
  )}&limit=${limit}`;
  const response = await axios.get(url);
  return response.data as XIVAPISearchResponse;
}
