import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type PublishCommunityTemplatePayload = {
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
  authorName: string;
  shouldUpdateEmail: boolean;
  shouldUpdateName: boolean;
  branchName: string;
};
export const publishCommunityTemplate = (
  payload: PublishCommunityTemplatePayload,
) => ({
  type: ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_INIT,
  payload,
});
