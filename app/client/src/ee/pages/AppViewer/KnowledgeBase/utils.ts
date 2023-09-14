import { EKBProcessingStatus, type TApplicationKB } from "./types";
import hash from "object-hash";

export const getIsKbGenerationPending = (appKb: TApplicationKB) => {
  return appKb.processingStatus === EKBProcessingStatus.IN_PROGRESS;
};
export const getIsKbGenerationIdle = (appKb: TApplicationKB) => {
  return appKb.processingStatus === EKBProcessingStatus.IDLE;
};

export const getPagesArray = (kb: TApplicationKB["publishedKB"]) => {
  return Object.keys(kb).map((key) => {
    return kb[key];
  });
};

export const isPageKBEmpty = (
  pageKb: TApplicationKB["publishedKB"][string],
) => {
  const { features, intro } = pageKb;

  if (!intro && features.length === 0) return true;

  const areFeaturesEmpty = features.every((feature) => {
    return !feature.name && !feature.description && feature.steps.length === 0;
  });

  if (areFeaturesEmpty) {
    return true;
  }

  return false;
};

export const getIsPublishedKBPresent = (appKb: TApplicationKB | null) => {
  if (!appKb) return false;

  const { publishedKB } = appKb;

  const pageSlugs = Object.keys(publishedKB);

  if (!pageSlugs.length) return false;

  const isKbEmpty = pageSlugs.every((slug) => {
    return isPageKBEmpty(publishedKB[slug]);
  });

  if (isKbEmpty) return false;

  return true;
};

export const getPublishedKbHash = (appKb: TApplicationKB) => {
  return hash(appKb.publishedKB);
};

export const getAnalyticsKBStatus = (appKb: TApplicationKB | null) => {
  if (!appKb) return "Not started";

  const { processingStatus, publishedKB } = appKb;

  if (processingStatus === EKBProcessingStatus.IN_PROGRESS)
    return "In Progress";

  const appKBPageSlugs = Object.keys(publishedKB);

  if (appKBPageSlugs.length > 0) {
    return "Generated";
  }

  return "Not started";
};
