import type { GitConfigReduxState } from "../types";

export const gitConfigInitialState: GitConfigReduxState = {
  globalProfile: {
    value: null,
    loading: false,
    error: null,
  },
  updateGlobalProfile: {
    loading: false,
    error: null,
  },
};
