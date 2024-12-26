import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

interface ToggleRepoLimitModalActionPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction =
  createSingleArtifactAction<ToggleRepoLimitModalActionPayload>(
    (state, action) => {
      const { open } = action.payload;

      state.ui.repoLimitErrorModalOpen = open;

      return state;
    },
  );
