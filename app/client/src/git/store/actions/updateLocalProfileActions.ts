import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { UpdateLocalProfileRequestParams } from "git/requests/updateLocalProfileRequest.types";

export interface UpdateLocalProfileInitPayload
  extends UpdateLocalProfileRequestParams {}

export const updateLocalProfileInitAction =
  createSingleArtifactAction<UpdateLocalProfileInitPayload>((state) => {
    state.apiResponses.updateLocalProfile.loading = true;
    state.apiResponses.updateLocalProfile.error = null;

    return state;
  });

export const updateLocalProfileSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateLocalProfile.loading = false;

    return state;
  },
);

export const updateLocalProfileErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.updateLocalProfile.loading = false;
    state.apiResponses.updateLocalProfile.error = error;

    return state;
  });
