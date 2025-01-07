import type { PayloadAction } from "@reduxjs/toolkit";
import type { GitGlobalReduxState } from "../types";

interface ToggleRepoLimitModalPayload {
  open: boolean;
}

export const toggleRepoLimitErrorModalAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<ToggleRepoLimitModalPayload>,
) => {
  const { open } = action.payload;

  state.repoLimitErrorModalOpen = open;

  return state;
};
