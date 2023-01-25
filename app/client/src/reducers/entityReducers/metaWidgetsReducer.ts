import { set, split, unset } from "lodash";

import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { BatchPropertyUpdatePayload } from "actions/controlActions";

export type MetaWidgetsReduxState = {
  [widgetId: string]: FlattenedWidgetProps;
};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

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
    const {
      addOrUpdate,
      creatorId,
      deleteIds,
      propertyUpdates,
    } = action.payload;

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
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: () => {
    return {};
  },
});

export default metaWidgetsReducer;
