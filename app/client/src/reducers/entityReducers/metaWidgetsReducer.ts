import { set, split, unset } from "lodash";

import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";

export type MetaWidgetsReduxState = {
  [widgetId: string]: FlattenedWidgetProps;
};

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
export type ModifyMetaWidgetPayload = {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  deleteIds: string[];
  propertyUpdates?: MetaWidgetPropertyUpdate[];
  creatorId?: string;
};

export type UpdateMetaWidgetPropertyPayload = {
  updates: BatchPropertyUpdatePayload;
  widgetId: string;
  creatorId?: string;
};
export type DeleteMetaWidgetsPayload = {
  creatorIds: string[];
};

type MetaWidgetPropertyUpdate = {
  path: string;
  value: unknown;
};

const initialState: MetaWidgetsReduxState = {};

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
});

export default metaWidgetsReducer;
