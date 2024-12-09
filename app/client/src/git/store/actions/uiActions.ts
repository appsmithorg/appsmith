import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

interface ToggleRepoLimitModalPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction =
  createSingleArtifactAction<ToggleRepoLimitModalPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.repoLimitErrorModal.open = open;

    return state;
  });

interface BranchListPopupPayload {
  open: boolean;
}

export const toggleBranchListPopupAction =
  createSingleArtifactAction<BranchListPopupPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.branchListPopup.open = open;

    return state;
  });
