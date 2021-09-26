import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { User } from "entities/AppCollab/CollabInterfaces";

const initialState: AppCollabReducerState = {
  editors: [],
  pointerData: {},
};

const appCollabReducer = createReducer(initialState, {
  [ReduxActionTypes.APP_COLLAB_LIST_EDITORS]: (
    state: AppCollabReducerState,
    action: ReduxAction<any>,
  ) => {
    return { ...state, editors: action.payload.users };
  },
  [ReduxActionTypes.APP_COLLAB_RESET_EDITORS]: (
    state: AppCollabReducerState,
  ) => {
    return { ...state, editors: [] };
  },
  [ReduxActionTypes.APP_COLLAB_SET_EDITORS_POINTER_DATA]: (
    state: AppCollabReducerState,
    action: ReduxAction<any>,
  ) => {
    return {
      ...state,
      pointerData: {
        ...state.pointerData,
        [action.payload.socketId]: action.payload,
      },
    };
  },
  [ReduxActionTypes.APP_COLLAB_UNSET_EDITORS_POINTER_DATA]: (
    state: AppCollabReducerState,
    action: ReduxAction<any>,
  ) => {
    const { pointerData } = state;
    delete pointerData[action.payload];
    return {
      ...state,
      pointerData,
    };
  },
  [ReduxActionTypes.APP_COLLAB_RESET_EDITORS_POINTER_DATA]: (
    state: AppCollabReducerState,
  ) => {
    return {
      ...state,
      pointerData: {},
    };
  },
});

type PointerDataType = {
  [s: string]: any;
};

export type AppCollabReducerState = {
  editors: User[];
  pointerData: PointerDataType;
};

export default appCollabReducer;
