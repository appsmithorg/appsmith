import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

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

export interface ReleasesState {
  newReleasesCount: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  releaseItems: any[];
}

export default importReducer;
