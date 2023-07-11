import { createImmerReducer } from "utils/ReducerUtils";
import _ from "lodash";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { PartialActionData } from "./actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { ActionResponse } from "api/ActionAPI";

const initialState: any = [];

const modulesReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_MODULES_SUCCESS]: (
    draftMetaState: Array<any>,
    action: ReduxAction<
      [{ id: string; response: ActionResponse; moduleId: string }]
    >,
  ) => {
    return action.payload.map((action) => {
      const foundAction = draftMetaState.find((currentAction) => {
        return currentAction.config.id === action.id;
      });
      return {
        isLoading: false,
        config: action,
        data: foundAction?.data,
      };
    });
  },
  [ReduxActionTypes.EXECUTE_MODULE_PLUGIN_ACTION_SUCCESS]: (
    draftMetaState: Array<any>,
    action: ReduxAction<{
      id: string;
      response: ActionResponse;
      moduleId: string;
    }>,
  ) => {
    const foundModule = draftMetaState.find((stateModule) => {
      return stateModule.config.id === action.payload.moduleId;
    });
    const foundAction = foundModule.config.publicActions.find(
      (stateAction: any) => {
        return stateAction.config.id === action.payload.id;
      },
    );
    if (foundAction) {
      foundAction.isLoading = false;
      if (foundAction.data) _.assign(foundAction.data, action.payload.response);
      else foundAction.data = action.payload.response;
    } else {
      const partialAction: PartialActionData = {
        isLoading: false,
        config: { id: action.payload.id },
        data: action.payload.response,
      };
      draftMetaState.push(partialAction);
    }
  },
});

export default modulesReducer;
