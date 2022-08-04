import { createReducer } from "utils/ReducerUtils";
import { JSAction, JSCollection } from "entities/JSCollection";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "ce/constants/ReduxActionConstants";
import { set, keyBy, findIndex, unset } from "lodash";
import produce from "immer";

const initialState: JSCollectionDataState = [];
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
    action: ReduxAction<{
      data: JSCollection;
    }>,
  ): JSCollectionDataState =>
    state.map((jsCollection) => {
      if (jsCollection.config.id === action.payload.data.id) {
        return {
          ...jsCollection,
          isLoading: false,
          config: action.payload.data,
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
      collectionName: string;
      collectionId: string;
      action: JSAction;
    }>,
  ): JSCollectionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.collectionId) {
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
      results: any;
      collectionId: string;
      actionId: string;
      isDirty: boolean;
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
          isDirty: {
            ...a.isDirty,
            [action.payload.actionId]: action.payload.isDirty,
          },
        };
      }
      return a;
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
});

export default jsActionsReducer;
