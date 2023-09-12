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
  type: ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_INIT,
  payload,
});
