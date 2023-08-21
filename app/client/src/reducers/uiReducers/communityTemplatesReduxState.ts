import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: CommunityTemplatesReduxState = {
  isPublishingTemplate: false,
};

const communityTemplateReducer = createReducer(initialState, {
  [ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_INIT]: (
    state: CommunityTemplatesReduxState,
  ): CommunityTemplatesReduxState => {
    return { ...state, isPublishingTemplate: true };
  },
  [ReduxActionTypes.COMMUNITY_TEMPLATE_PUBLISH_SUCCESS]: (
    state: CommunityTemplatesReduxState,
  ): CommunityTemplatesReduxState => {
    return { ...state, isPublishingTemplate: false };
  },
  [ReduxActionErrorTypes.COMMUNITY_TEMPLATE_PUBLISH_ERROR]: (
    state: CommunityTemplatesReduxState,
  ): CommunityTemplatesReduxState => {
    return { ...state, isPublishingTemplate: false };
  },
});

export interface CommunityTemplatesReduxState {
  isPublishingTemplate: boolean;
}

export default communityTemplateReducer;
