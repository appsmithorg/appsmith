import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export enum DocsLink {
  CAPTURE_DATA = "CAPTURE_DATA",
  WHITELIST_IP = "WHITELIST_IP",
  CONNECT_DATA = "CONNECT_DATA",
  QUERY = "QUERY",
  TROUBLESHOOT_ERROR = "TROUBLESHOOT_ERROR",
  QUERY_SETTINGS = "QUERY_SETTINGS",
  APPSMITH_AI_DEPRECATION = "APPSMITH_AI_DEPRECATION",
}

const LinkData: Record<DocsLink, string> = {
  CONNECT_DATA:
    "https://docs.appsmith.com/core-concepts/connecting-to-data-sources",
  QUERY:
    "https://docs.appsmith.com/core-concepts/connecting-to-data-sources#docusaurus_skipToContent_fallback",
  WHITELIST_IP:
    "https://docs.appsmith.com/core-concepts/connecting-to-data-sources/connecting-to-databases",
  CAPTURE_DATA:
    "https://docs.appsmith.com/core-concepts/data-access-and-binding/capturing-data-write",
  TROUBLESHOOT_ERROR:
    "https://docs.appsmith.com/help-and-support/troubleshooting-guide",
  QUERY_SETTINGS:
    "https://docs.appsmith.com/connect-data/reference/query-settings",
  // TODO: replace with the dedicated Appsmith AI → BYOK migration guide once
  // published, and restore the "Learn how to migrate" label in messages.ts
  // (APPSMITH_AI_DEPRECATION_LEARN_MORE)
  APPSMITH_AI_DEPRECATION:
    "https://docs.appsmith.com/connect-data/reference/appsmith-ai",
};

export const openDoc = (type: DocsLink, link?: string, subType?: string) => {
  let linkToOpen = LinkData[type];

  if (link && link.length) {
    linkToOpen = link;
  }

  AnalyticsUtil.logEvent("OPEN_DOCS", { source: type, queryType: subType });
  window.open(linkToOpen, "_blank");
};
