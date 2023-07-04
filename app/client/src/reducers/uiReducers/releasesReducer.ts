import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const initialState: ReleasesState = {
  newReleasesCount: "",
  releaseItems: [],
};

const importReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_RELEASES_SUCCESS]: (
    _state: ReleasesState,
    action: ReduxAction<{ payload: Record<string, unknown> }>,
  ) => action.payload,
  [ReduxActionTypes.RESET_UNREAD_RELEASES_COUNT]: (state: ReleasesState) => ({
    ...state,
    newReleasesCount: "",
  }),
});

export type ReleasesState = {
  newReleasesCount: string;
  releaseItems: any[];
};

export default importReducer;
