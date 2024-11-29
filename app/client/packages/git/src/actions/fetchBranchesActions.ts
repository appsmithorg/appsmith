import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitBranches,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchBranchesInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.branches.loading = true;
  state.apiResponses.branches.error = null;

  return state;
});

export const fetchBranchesSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ branches: GitBranches }>) => {
    state.apiResponses.branches.loading = false;
    state.apiResponses.branches.value = action.payload.branches;

    return state;
  },
);

export const fetchBranchesErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.branches.loading = false;
    state.apiResponses.branches.error = error;

    return state;
  },
);
