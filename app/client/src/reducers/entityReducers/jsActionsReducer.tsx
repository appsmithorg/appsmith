import { createReducer } from "utils/AppsmithUtils";
import { JSCollection } from "entities/JSCollection";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { keyBy } from "lodash";

const initialState: JSCollectionDataState = [];

export interface JSCollectionData {
  isLoading: boolean;
  config: JSCollection;
  data?: Record<string, unknown>;
  isExecuting?: Record<string, boolean>;
}
export type JSCollectionDataState = JSCollectionData[];
export interface PartialActionData {
  isLoading: boolean;
  config: { id: string };
  data: Record<string, unknown>;
  isExecuting: Record<string, boolean>;
}

const jsActionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection[]>,
  ): JSCollectionDataState => {
    return action.payload.map((action) => {
      const foundAction = state.find((currentAction) => {
        return currentAction.config.id === action.id;
      });
      return {
        isLoading: false,
        config: action,
        data: foundAction?.data,
      };
    });
  },
  [ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR]: () => initialState,
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection>,
  ): JSCollectionDataState =>
    state.concat([
      {
        config: { ...action.payload },
        isLoading: false,
      },
    ]),
  [ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection>,
  ): JSCollectionDataState =>
    state.filter(
      (a) =>
        a.config.name !== action.payload.name &&
        a.config.id !== action.payload.name,
    ),
  [ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ data: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return { isLoading: false, config: action.payload.data };
      return a;
    }),
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ data: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return {
          isLoading: false,
          config: action.payload.data,
        };
      return a;
    }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ data: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return { isLoading: false, config: action.payload.data };
      return a;
    }),
  [ReduxActionTypes.COPY_JS_ACTION_INIT]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): JSCollectionDataState =>
    state.concat(
      state
        .filter((a) => a.config.id === action.payload.id)
        .map((a) => ({
          ...a,
          data: undefined,
          config: {
            ...a.config,
            id: "TEMP_COPY_ID",
            name: action.payload.name,
            pageId: action.payload.destinationPageId,
          },
        })),
    ),
  [ReduxActionTypes.COPY_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.name === action.payload.name
      ) {
        return {
          ...a,
          config: action.payload,
        };
      }

      return a;
    }),
  [ReduxActionErrorTypes.COPY_JS_ACTION_ERROR]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): JSCollectionDataState =>
    state.filter((a) => {
      if (a.config.pageId === action.payload.destinationPageId) {
        if (a.config.id === action.payload.id) {
          return a.config.name !== action.payload.name;
        }
        return true;
      }

      return true;
    }),
  [ReduxActionTypes.MOVE_JS_ACTION_INIT]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          config: {
            ...a.config,
            pageId: action.payload.destinationPageId,
          },
        };
      }

      return a;
    }),
  [ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection[]>,
  ): JSCollectionDataState =>
    action.payload.map((a) => ({
      isLoading: false,
      config: a,
    })),
  [ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR]: () => initialState,
  [ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection[]>,
  ): JSCollectionDataState => {
    if (action.payload.length > 0) {
      const stateActionMap = keyBy(state, "config.id");
      const result: JSCollectionDataState = [];

      action.payload.forEach((actionPayload: JSCollection) => {
        const stateAction = stateActionMap[actionPayload.id];
        if (stateAction) {
          result.push({
            data: stateAction.data,
            isLoading: false,
            config: actionPayload,
          });

          delete stateActionMap[actionPayload.id];
        } else {
          result.push({
            isLoading: false,
            config: actionPayload,
          });
        }
      });

      Object.keys(stateActionMap).forEach((stateActionKey) => {
        result.push(stateActionMap[stateActionKey]);
      });

      return result;
    }
    return state;
  },
  [ReduxActionTypes.MOVE_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id) {
        return { ...a, config: action.payload };
      }

      return a;
    }),
  [ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ id: string; originalPageId: string }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          config: {
            ...a.config,
            pageId: action.payload.originalPageId,
          },
        };
      }

      return a;
    }),
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ id: string }>,
  ): JSCollectionDataState =>
    state.filter((a) => a.config.id !== action.payload.id),
  [ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      results: any;
      collectionId: string;
      actionId: string;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collectionId) {
        return {
          ...a,
          isExecuting: {
            ...a.isExecuting,
            [action.payload.actionId]: true,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      results: any;
      collectionId: string;
      actionId: string;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collectionId) {
        return {
          ...a,
          data: {
            ...a.data,
            [action.payload.actionId]: action.payload.results,
          },
          isExecuting: {
            ...a.isExecuting,
            [action.payload.actionId]: false,
          },
        };
      }
      return a;
    }),
});

export default jsActionsReducer;
