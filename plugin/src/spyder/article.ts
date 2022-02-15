import cheerio from "cheerio";

export function getArticleText(content: String) {
  const $ = cheerio.load(content.toString());
  return $("p")
    .map(function (this) {
      return $(this).text();
    })
    .get()
    .join("\n")
    .split("如果您遇到了任何问题，欢迎您与我们联系，给您造成不便十分抱歉。")[0];
}
