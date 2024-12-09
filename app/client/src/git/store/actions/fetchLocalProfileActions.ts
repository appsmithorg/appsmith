import type { FetchLocalProfileResponseData } from "git/requests/fetchLocalProfileRequest.types";
import type {
  GitArtifactErrorPayloadAction,
  GitAsyncSuccessPayload,
} from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export const fetchLocalProfileInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.localProfile.loading = true;
    state.apiResponses.localProfile.error = null;

    return state;
  },
);

export const fetchLocalProfileSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchLocalProfileResponseData>
>((state, action) => {
  state.apiResponses.localProfile.loading = false;
  state.apiResponses.localProfile.value = action.payload.responseData;

  return state;
});

export const fetchLocalProfileErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.localProfile.loading = false;
    state.apiResponses.localProfile.error = error;

    return state;
  },
);
