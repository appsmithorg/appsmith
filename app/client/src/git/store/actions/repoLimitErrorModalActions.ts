import { createArtifactAction } from "../helpers/createArtifactAction";

interface ToggleRepoLimitModalActionPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction =
  createArtifactAction<ToggleRepoLimitModalActionPayload>((state, action) => {
    const { open } = action.payload;

    state.ui.repoLimitErrorModalOpen = open;

    return state;
  });
