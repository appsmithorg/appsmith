import type { GitArtifactPayloadAction, GitBranches } from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchBranchesInitAction = createSingleArtifactAction((state) => {
  state.branches.loading = true;
  state.branches.error = null;

  return state;
});

export const fetchBranchesSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ branches: GitBranches }>) => {
    state.branches.loading = false;
    state.branches.value = action.payload.branches;

    return state;
  },
);

export const fetchBranchesErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.branches.loading = false;
    state.branches.error = error;

    return state;
  },
);
