export * from "ce/reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/entityReducers/actionsReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import type { ActionData as CE_ActionData } from "ce/reducers/entityReducers/actionsReducer";
import type { Action } from "entities/Action";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import type { ConvertEntityToInstanceResponse } from "@appsmith/api/ModuleInstanceApi";
import type { ConvertEntityToInstanceActionPayload } from "@appsmith/actions/moduleInstanceActions";
import { ReduxActionErrorTypes } from "@appsmith/constants/ReduxActionConstants";

export interface ActionData extends CE_ActionData {
  isConverting?: boolean;
}

export type ActionDataState = ActionData[];

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    const result: ActionDataState = [];

    action.payload.actions.forEach((actionPayload: Action) => {
      result.push({
        isLoading: false,
        config: actionPayload,
      });
    });

    return result;
  },
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;

    return draftMetaState.filter(
      (a) => a.config.moduleId !== moduleId && a.config.isPublic,
    );
  },
  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_INIT]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<ConvertEntityToInstanceActionPayload>,
  ) => {
    const { publicEntityId } = action.payload;
    draftMetaState.forEach((action) => {
      if (action.config.id === publicEntityId) {
        action.isConverting = true;
      }
    });
  },
  [ReduxActionErrorTypes.CONVERT_ENTITY_TO_INSTANCE_ERROR]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<ConvertEntityToInstanceActionPayload>,
  ) => {
    const { publicEntityId } = action.payload;
    draftMetaState.forEach((action) => {
      if (action.config.id === publicEntityId) {
        action.isConverting = false;
      }
    });
  },

  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<ConvertEntityToInstanceResponse>,
  ) => {
    const { originalEntityId } = action.payload;

    return draftMetaState.filter((a) => a.config.id !== originalEntityId);
  },
};

const initialState: ActionDataState = [];

const actionsReducer = createImmerReducer(initialState, handlers);

export default actionsReducer;
