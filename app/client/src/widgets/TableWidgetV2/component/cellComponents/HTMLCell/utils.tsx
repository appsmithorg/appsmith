import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { RenderMode } from "constants/WidgetConstants";
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

// Function to extract unique HTML tags from a string
export function extractHTMLTags(htmlString: string): string[] {
  // Create a temporary DOM element
  const div = document.createElement("div");

  div.innerHTML = htmlString;

  // Get all elements and convert to array
  const elements = Array.from(div.getElementsByTagName("*"));

  // Extract unique tag names and convert to lowercase
  const uniqueTags = new Set(
    elements.map((element) => element.tagName.toLowerCase()),
  );

  return Array.from(uniqueTags);
}

export const getRenderMode = (renderMode: RenderMode) => {
  switch (renderMode) {
    case "CANVAS":
      return "EDITOR";
    default:
      return "DEPLOYED";
  }
};
