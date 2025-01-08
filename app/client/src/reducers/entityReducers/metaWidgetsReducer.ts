import { get, set, split, unset } from "lodash";
import { klona } from "klona";

import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  MetaWidgetsReduxState,
  FlattenedWidgetProps,
  ModifyMetaWidgetPayload,
  UpdateMetaWidgetPropertyPayload,
  DeleteMetaWidgetsPayload,
} from "./metaWidgetsReducer.types";
import type { UpdateWidgetsPayload } from "./canvasWidgetsReducer.types";

export const initialState: MetaWidgetsReduxState = {};

const metaWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: (
    state: MetaWidgetsReduxState,
    action: ReduxAction<ModifyMetaWidgetPayload>,
  ) => {
    const { addOrUpdate, creatorId, deleteIds, propertyUpdates } =
      action.payload;

    if (addOrUpdate) {
      Object.entries(addOrUpdate).forEach(([metaWidgetId, widgetProps]) => {
        state[metaWidgetId] = { ...widgetProps };
        state[metaWidgetId].isMetaWidget = true;
        state[metaWidgetId].creatorId = creatorId;
      });
    }

    deleteIds.forEach((deleteId) => {
      if (state[deleteId]?.creatorId === creatorId) {
        delete state[deleteId];
      }
    });

    (propertyUpdates || []).forEach(({ path, value }) => {
      const [widgetId, ...propertyPathChunks] = split(path, ".");
      const propertyPath = propertyPathChunks.join(".");

      set(state[widgetId], propertyPath, value);
    });

    return state;
  },
  [ReduxActionTypes.DELETE_META_WIDGETS]: (
    state: MetaWidgetsReduxState,
    action: ReduxAction<DeleteMetaWidgetsPayload>,
  ) => {
    const { creatorIds } = action.payload;

    creatorIds.forEach((creatorId) => {
      Object.keys(state).forEach((metaWidgetId) => {
        if (state[metaWidgetId]?.creatorId === creatorId) {
          delete state[metaWidgetId];
        }
      });
    });

    return state;
  },
  [ReduxActionTypes.UPDATE_META_WIDGET_PROPERTY]: (
    state: MetaWidgetsReduxState,
    action: ReduxAction<UpdateMetaWidgetPropertyPayload>,
  ) => {
    const { creatorId, updates, widgetId } = action.payload;
    const { modify = {}, remove = [] } = updates;

    if (state[widgetId].creatorId === creatorId) {
      Object.entries(modify).forEach(([propertyPath, propertyValue]) => {
        set(state[widgetId], propertyPath, propertyValue);
      });

      remove.forEach((propertyPath) => {
        unset(state[widgetId], propertyPath);
      });
    }

    return state;
  },
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: (state: MetaWidgetsReduxState) => {
    return state;
  },
  [ReduxActionTypes.UPDATE_MULTIPLE_META_WIDGET_PROPERTIES]: (
    state: MetaWidgetsReduxState,
    action: ReduxAction<{
      widgetsToUpdate: UpdateWidgetsPayload;
      shouldEval: boolean;
    }>,
  ) => {
    // For each widget whose properties we would like to update
    for (const [widgetId, propertyPathsToUpdate] of Object.entries(
      action.payload.widgetsToUpdate,
    )) {
      // Iterate through each property to update in `widgetId`
      (propertyPathsToUpdate as Array<{ propertyPath: string; propertyValue: unknown }>).forEach(
        ({ propertyPath, propertyValue }) => {
          const path = `${widgetId}.${propertyPath}`;
          // Get original value in reducer
          const originalPropertyValue = get(state, path);

          // If the original and new values are different
          if (propertyValue !== originalPropertyValue)
            // Set the new values
            set(state, path, propertyValue);
        },
      );
    }
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
});

export default metaWidgetsReducer;
