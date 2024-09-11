import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface PublishCommunityTemplatePayload {
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
  authorName: string;
  shouldUpdateEmail: boolean;
  shouldUpdateName: boolean;
  branchName: string;
  appUrl: string;
}
export const publishCommunityTemplate = (
  payload: PublishCommunityTemplatePayload,
) => ({
  type: ReduxActionTypes.PUBLISH_APP_AS_COMMUNITY_TEMPLATE_INIT,
  payload,
});
