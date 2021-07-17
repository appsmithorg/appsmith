import { createReducer } from "utils/AppsmithUtils";
import { JSAction, JSSubAction } from "entities/JSAction";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
const initialState: any = [];

export interface JSActionData {
  isLoading: boolean;
  config: JSAction;
  data?: any;
}
export type JSActionDataState = JSActionData[];
export interface PartialActionData {
  isLoading: boolean;
  config: { id: string };
  data?: any;
}

const jsActionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction[]>,
  ): JSActionDataState => {
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
  [ReduxActionTypes.CREATE_JS_ACTION_INIT]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.concat([
      {
        config: { ...action.payload, id: action.payload.name },
        isLoading: false,
      },
    ]),
  [ReduxActionTypes.ADD_JS_ACTION_TO_COLLECTION]: (
    state: JSActionDataState,
    action: ReduxAction<{
      jsAction: JSAction;
      subActions: Array<JSSubAction>;
    }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.jsAction.id) {
        for (let i = 0; i < action.payload.subActions.length; i++) {
          a.config.actions.push({
            ...action.payload.subActions[i],
          });
        }
      }
      return a;
    }),
  [ReduxActionTypes.UPDATE_JS_ACTION_TO_COLLECTION]: (
    state: JSActionDataState,
    action: ReduxAction<{
      jsAction: JSAction;
      subActions: Array<JSSubAction>;
    }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.jsAction.id) {
        for (let i = 0; i < action.payload.subActions.length; i++) {
          const subActions = action.payload.subActions;
          a.config.actions.map((action) => {
            if (action.id === subActions[i].id) {
              return subActions[i];
            }
            return action;
          });
        }
      }
      return a;
    }),
  [ReduxActionTypes.DELETE_JS_ACTION_FROM_COLLECTION]: (
    state: JSActionDataState,
    action: ReduxAction<{
      jsAction: JSAction;
      subActions: Array<JSSubAction>;
    }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.jsAction.id) {
        for (let i = 0; i < action.payload.subActions.length; i++) {
          const subActions = action.payload.subActions;
          a.config.actions.map((action) => {
            if (action.id !== subActions[i].id) {
              return action;
            }
          });
        }
      }
      return a;
    }),
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.map((a) => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.id === action.payload.name
      ) {
        return { ...a, config: action.payload };
      }
      return a;
    }),
  [ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.filter(
      (a) =>
        a.config.name !== action.payload.name &&
        a.config.id !== action.payload.name,
    ),
  [ReduxActionTypes.UPDATE_JS_ACTION_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<{ data: JSAction }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return { isLoading: false, config: action.payload.data };
      return a;
    }),
  [ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR]: (
    state: JSActionDataState,
    action: ReduxAction<{ data: JSAction }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.data.id)
        return { isLoading: false, config: action.payload.data };
      return a;
    }),
  [ReduxActionTypes.COPY_JS_ACTION_INIT]: (
    state: JSActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): JSActionDataState =>
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
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
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
    state: JSActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): JSActionDataState =>
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
    state: JSActionDataState,
    action: ReduxAction<{
      id: string;
      destinationPageId: string;
      name: string;
    }>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id) {
        return {
          ...a,
          config: {
            ...a.config,
            name: action.payload.name,
            pageId: action.payload.destinationPageId,
          },
        };
      }

      return a;
    }),
  [ReduxActionTypes.MOVE_JS_ACTION_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.map((a) => {
      if (a.config.id === action.payload.id) {
        return { ...a, config: action.payload };
      }

      return a;
    }),
  [ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR]: (
    state: JSActionDataState,
    action: ReduxAction<{ id: string; originalPageId: string }>,
  ): JSActionDataState =>
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
    state: JSActionDataState,
    action: ReduxAction<{ id: string }>,
  ): JSActionDataState =>
    state.filter((a) => a.config.id !== action.payload.id),
});

export default jsActionsReducer;
