import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
export const publishCommunityTemplate = (payload: {
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
  authorName: string;
}) => ({
  type: ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_INIT,
  payload,
});
