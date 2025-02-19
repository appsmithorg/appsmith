import { createArtifactAction } from "../helpers/createArtifactAction";

export interface UpdateCurrentBranchPayload {
  branchName: string;
}

export const updateCurrentBranchAction =
  createArtifactAction<UpdateCurrentBranchPayload>((state, action) => {
    state.ui.currentBranch = action.payload.branchName;

    return state;
  });

export const resetCurrentBranchAction = createArtifactAction((state) => {
  state.ui.currentBranch = null;

  return state;
});
