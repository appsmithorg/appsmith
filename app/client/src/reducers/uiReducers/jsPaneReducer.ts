import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { JSCollection } from "entities/JSCollection";
export interface JsPaneReduxState {
  isCreating: boolean;
  isFetching: boolean;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
}

const initialState: JsPaneReduxState = {
  isCreating: false,
  isFetching: false,
  isSaving: {},
  isDeleting: {},
  isDirty: {},
};

const jsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_JS_ACTIONS_INIT]: (state: JsPaneReduxState) => ({
    ...state,
    isFetching: true,
  }),
  [ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS]: (state: JsPaneReduxState) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR]: (
    state: JsPaneReduxState,
  ) => ({
    ...state,
    isFetching: false,
  }),
  [ReduxActionTypes.CREATE_JS_ACTION_INIT]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: true,
  }),
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
  ): JsPaneReduxState => ({
    ...state,
    isCreating: false,
  }),
  [ReduxActionTypes.UPDATE_JS_ACTION_INIT]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.id]: true,
    },
  }),
  [ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_BODY_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionTypes.REFACTOR_JS_ACTION_NAME_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ collectionId: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.collectionId]: false,
    },
    isDirty: {
      ...state.isDirty,
      [action.payload.collectionId]: false,
    },
  }),

  [ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ data: JSCollection }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.data.id]: false,
    },
  }),
  [ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ collectionId: string }>,
  ) => ({
    ...state,
    isSaving: {
      ...state.isSaving,
      [action.payload.collectionId]: false,
    },
  }),
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
  [ReduxActionErrorTypes.DELETE_JS_ACTION_ERROR]: (
    state: JsPaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    isDeleting: {
      ...state.isDeleting,
      [action.payload.id]: false,
    },
  }),
});

export default jsPaneReducer;
