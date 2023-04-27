import AnalyticsUtil from "../utils/AnalyticsUtil";

export enum DocsLink {
  CAPTURE_DATA = "CAPTURE_DATA",
  WHITELIST_IP = "WHITELIST_IP",
  CONNECT_DATA = "CONNECT_DATA",
  QUERY = "QUERY",
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
};

export const openDoc = (type: DocsLink, link?: string, subType?: string) => {
  let linkToOpen = LinkData[type];
  if (link && link.length) {
    linkToOpen = link;
  }
  AnalyticsUtil.logEvent("OPEN_DOCS", { source: type, queryType: subType });
  window.open(linkToOpen, "_blank");
};
