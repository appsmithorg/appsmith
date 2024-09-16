import { createReducer } from "utils/ReducerUtils";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import { set, keyBy, findIndex, unset } from "lodash";
import produce from "immer";
import { klona } from "klona";

export const initialState: JSCollectionDataState = [];

export interface JSCollectionData {
  isLoading: boolean;
  config: JSCollection;
  data?: Record<string, unknown>;
  isExecuting?: Record<string, boolean>;
  activeJSActionId?: string;
  // Existence of parse errors for each action (updates after execution)
  isDirty?: Record<string, boolean>;
}
export type JSCollectionDataState = JSCollectionData[];
export interface PartialActionData {
  isLoading: boolean;
  config: { id: string };
  data: Record<string, unknown>;
  isExecuting: Record<string, boolean>;
}

export interface JSExecutionData {
  data: unknown;
  collectionId: string;
  actionId: string;
}

export interface JSExecutionError {
  isDirty: true;
  actionId: string;
  collectionId: string;
}

// Object of collectionIds to JSExecutionData[]
export type BatchedJSExecutionData = Record<string, JSExecutionData[]>;
export type BatchedJSExecutionErrors = Record<string, JSExecutionError[]>;

export const handlers = {
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
    action: ReduxAction<{
      data: JSCollection;
    }>,
  ): JSCollectionDataState =>
    state.map((jsCollection) => {
      if (jsCollection.config.id === action.payload.data.id) {
        return {
          ...jsCollection,
          isLoading: false,
          config: action.payload.data.isPublic
            ? {
                ...action.payload.data,
                isMainJSCollection: true,
                displayName: "Main",
              }
            : {
                ...action.payload.data,
                isMainJSCollection: jsCollection.config.isMainJSCollection,
              },
          activeJSActionId:
            findIndex(jsCollection.config.actions, {
              id: jsCollection.activeJSActionId,
            }) === -1
              ? undefined
              : jsCollection.activeJSActionId,
        };
      }
      return jsCollection;
    }),
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ data: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return {
          ...a,
          isLoading: false,
          config: action.payload.data.isPublic
            ? {
                ...action.payload.data,
                isMainJSCollection: true,
                displayName: "Main",
              }
            : {
                ...action.payload.data,
                isMainJSCollection: a.config.isMainJSCollection,
              },
        };
      return a;
    }),
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ id: string; body: string }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id)
        return {
          ...a,
          config: { ...a.config, body: action.payload.body },
        };
      return a;
    }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ data: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return {
          isLoading: false,
          config: action.payload.data.isPublic
            ? {
                ...action.payload.data,
                isMainJSCollection: true,
                displayName: "Main",
              }
            : action.payload.data,
        };
      return a;
    }),
  [ReduxActionTypes.COPY_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<JSCollection>,
  ): JSCollectionDataState =>
    state.concat([
      {
        config: { ...action.payload },
        isLoading: false,
      },
    ]),
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
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ id: string }>,
  ): JSCollectionDataState =>
    state.filter((a) => a.config.id !== action.payload.id),
  [ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      collection: JSCollection;
      action: JSAction;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collection.id) {
        const newData = { ...a.data };
        const newIsDirty = { ...a.isDirty };
        unset(newData, action.payload.action.id);
        unset(newIsDirty, action.payload.action.id);
        return {
          ...a,
          isExecuting: {
            ...a.isExecuting,
            [action.payload.action.id]: true,
          },
          data: {
            ...newData,
          },
          isDirty: {
            ...newIsDirty,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      collectionId: string;
      actionId: string;
      isDirty: boolean;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collectionId) {
        return {
          ...a,
          isExecuting: {
            ...a.isExecuting,
            [action.payload.actionId]: false,
          },
          isDirty: {
            ...a.isDirty,
            [action.payload.actionId]: action.payload.isDirty,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_DATA]: (
    state: JSCollectionDataState,
    action: ReduxAction<BatchedJSExecutionData>,
  ): JSCollectionDataState =>
    state.map((jsCollectionData) => {
      const collectionId = jsCollectionData.config.id;
      if (action.payload.hasOwnProperty(collectionId)) {
        let data = {
          ...jsCollectionData.data,
        };
        action.payload[collectionId].forEach((item) => {
          data = { ...data, [item.actionId]: item.data };
        });
        return {
          ...jsCollectionData,
          data,
        };
      }
      return jsCollectionData;
    }),
  [ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_ERRORS]: (
    state: JSCollectionDataState,
    action: ReduxAction<BatchedJSExecutionErrors>,
  ): JSCollectionDataState =>
    state.map((jsCollectionData) => {
      const collectionId = jsCollectionData.config.id;
      if (action.payload.hasOwnProperty(collectionId)) {
        let isDirty = {
          ...jsCollectionData.isDirty,
        };
        action.payload[collectionId].forEach(({ actionId }) => {
          isDirty = { ...isDirty, [actionId]: true };
        });
        return {
          ...jsCollectionData,
          isDirty,
        };
      }
      return jsCollectionData;
    }),
  [ReduxActionTypes.UPDATE_JS_FUNCTION_PROPERTY_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{ collection: JSCollection }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collection.id) {
        return {
          ...a,
          data: action.payload,
        };
      }
      return a;
    }),
  [ReduxActionTypes.TOGGLE_FUNCTION_EXECUTE_ON_LOAD_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      actionId: string;
      collectionId: string;
      executeOnLoad: boolean;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collectionId) {
        const updatedActions = a.config.actions.map((jsAction) => {
          if (jsAction.id === action.payload.actionId) {
            set(jsAction, `executeOnLoad`, action.payload.executeOnLoad);
          }
          return jsAction;
        });
        return {
          ...a,
          config: {
            ...a.config,
            actions: updatedActions,
          },
        };
      }
      return a;
    }),
  [ReduxActionTypes.SET_JS_ACTION_TO_EXECUTE_ON_PAGELOAD]: (
    state: JSCollectionDataState,
    action: ReduxAction<
      Array<{
        executeOnLoad: boolean;
        id: string;
        name: string;
        collectionId: string;
      }>
    >,
  ) => {
    return produce(state, (draft) => {
      const CollectionUpdateSearch = keyBy(action.payload, "collectionId");
      const actionUpdateSearch = keyBy(action.payload, "id");
      draft.forEach((action, index) => {
        if (action.config.id in CollectionUpdateSearch) {
          const allActions = draft[index].config.actions;
          allActions.forEach((js) => {
            if (js.id in actionUpdateSearch) {
              js.executeOnLoad = actionUpdateSearch[js.id].executeOnLoad;
            }
          });
        }
      });
    });
  },
  [ReduxActionTypes.SET_ACTIVE_JS_ACTION]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      jsCollectionId: string;
      jsActionId: string;
    }>,
  ): JSCollectionDataState =>
    state.map((jsCollection) => {
      if (jsCollection.config.id === action.payload.jsCollectionId) {
        return {
          ...jsCollection,
          activeJSActionId: action.payload.jsActionId,
        };
      }
      return jsCollection;
    }),
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
  [ReduxActionTypes.UPDATE_TEST_PAYLOAD_FOR_COLLECTION]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      collectionId: string;
      testPayload: Record<string, unknown>;
    }>,
  ): JSCollectionDataState =>
    state.map((jsCollectionData) => {
      if (jsCollectionData.config.id === action.payload.collectionId) {
        return {
          ...jsCollectionData,
          data: {
            ...jsCollectionData.data,
            testPayload: action.payload.testPayload,
          },
        };
      }
      return jsCollectionData;
    }),
  [ReduxActionTypes.UPDATE_TEST_PAYLOAD_FOR_JS_ACTION]: (
    state: JSCollectionDataState,
    action: ReduxAction<{
      collectionId: string;
      actionId: string;
      testPayload: Record<string, unknown>;
    }>,
  ): JSCollectionDataState =>
    state.map((jsCollectionData) => {
      if (jsCollectionData.config.id === action.payload.collectionId) {
        return {
          ...jsCollectionData,
          data: {
            ...jsCollectionData.data,
            testPayload: {
              ...(jsCollectionData.data?.testPayload || {}),
              [action.payload.actionId]: action.payload.testPayload,
            },
          },
        };
      }
      return jsCollectionData;
    }),
};

const jsActionsReducer = createReducer(initialState, handlers);

export default jsActionsReducer;
