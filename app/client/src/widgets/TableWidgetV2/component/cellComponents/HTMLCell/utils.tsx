import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { debounce } from "lodash";

export const sendHTMLCellAnalytics = debounce(
  (tags: string[]) => {
    AnalyticsUtil.logEvent("TABLE_WIDGET_V2_HTML_CELL_USAGE", {
      tags: tags,
    });
  },
  1000,
  { leading: true, trailing: false, maxWait: 5000 },
);

export function extractHTMLTags(htmlString: string): string[] {
  const div = document.createElement("div");

  div.innerHTML = htmlString;
  const elements = Array.from(div.getElementsByTagName("*"));
  const uniqueTags = new Set(
    elements.map((element) => element.tagName.toLowerCase()),
  );

  return Array.from(uniqueTags);
}
