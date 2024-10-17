/* eslint-disable padding-line-between-statements */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Define a type for the slice state
interface GitMetadata {}
interface GitApplicationReduxState {
  metadata: GitMetadata;
  connect: {
    loading: boolean;
    error: string | null;
  };
}

const gitApplicationInitialState: GitApplicationReduxState = {
  metadata: {},
  connect: {
    loading: false,
    error: null,
  },
};
// Define the initial state using that type
const initialState: Record<string, GitApplicationReduxState> = {};

export const gitApplicationSlice = createSlice({
  name: "git/applications",
  initialState,
  reducers: {
    mount: (state, action: PayloadAction<{ baseApplicationId: string }>) => {
      const { baseApplicationId } = action.payload;
      if (!state[baseApplicationId]) {
        state[baseApplicationId] = gitApplicationInitialState;
      }
      return state;
    },
    setMetadata: (
      state,
      action: PayloadAction<{
        baseApplicationId: string;
        metadata: GitMetadata;
      }>,
    ) => {
      const { baseApplicationId } = action.payload;
      state[baseApplicationId].metadata = action.payload;
      return state;
    },
    connectInit: (
      state,
      action: PayloadAction<{ baseApplicationId: string }>,
    ) => {
      const { baseApplicationId } = action.payload;
      state[baseApplicationId].connect.loading = true;
      state[baseApplicationId].connect.error = null;
      return state;
    },
    connectError: (
      state,
      action: PayloadAction<{ baseApplicationId: string; error: string }>,
    ) => {
      const { baseApplicationId, error } = action.payload;
      state[baseApplicationId].connect.loading = false;
      state[baseApplicationId].connect.error = error;
      return state;
    },
  },
});

export const { connectInit } = gitApplicationSlice.actions;

// exporting the redux store slice
export default gitApplicationSlice.reducer;
