import type { AppState } from "@appsmith/reducers";

export const isPublishingCommunityTempalteSelector = (state: AppState) =>
  state.ui.communityTemplates.isPublishingTemplate;
