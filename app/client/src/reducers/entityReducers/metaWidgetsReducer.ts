import { get, set, split, unset } from "lodash";
import { klona } from "klona";

import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import type { UpdateWidgetsPayload } from "ee/reducers/entityReducers/canvasWidgetsReducer";

export interface MetaWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

/**
 * addOrUpdate - Set of meta widgets that needs to be added to the metaWidgetReducer.
 * deleteIds - List of meta widget ids that is to be removed from the metaWidgetReducer.
 * propertyUpdates - These are specific updates that needs to be carried out based on the
 *  path provided. This is an array of objects (path, value).
 * creatorId - This represents the creator of the meta widgets that are passed to
 *  addOrUpdate/deleteIds. If a list widget creates creates/adds a bunch of meta widgets then
 *  the creatorId would be the list widget's widgetId.
 */
export interface ModifyMetaWidgetPayload {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  deleteIds: string[];
  propertyUpdates?: MetaWidgetPropertyUpdate[];
  creatorId?: string;
}

export interface UpdateMetaWidgetPropertyPayload {
  updates: BatchPropertyUpdatePayload;
  widgetId: string;
  creatorId?: string;
}

export interface DeleteMetaWidgetsPayload {
  creatorIds: string[];
}

interface MetaWidgetPropertyUpdate {
  path: string;
  value: unknown;
}

export const initialState: MetaWidgetsReduxState = {};

const modifyMetaWidgets = (
  state: MetaWidgetsReduxState,
  action: ReduxAction<ModifyMetaWidgetPayload>,
) => {
  const { addOrUpdate, creatorId, deleteIds, propertyUpdates } = action.payload;

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
};

const metaWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: modifyMetaWidgets,
  [ReduxActionTypes.MODIFY_META_WIDGETS_WITHOUT_EVAL]: modifyMetaWidgets,
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
      propertyPathsToUpdate.forEach(({ propertyPath, propertyValue }) => {
        const path = `${widgetId}.${propertyPath}`;
        // Get original value in reducer
        const originalPropertyValue = get(state, path);

        // If the original and new values are different
        if (propertyValue !== originalPropertyValue)
          // Set the new values
          set(state, path, propertyValue);
      });
    }
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },
});

export default metaWidgetsReducer;
