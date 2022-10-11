import { set, split } from "lodash";

import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

export type MetaCanvasWidgetsReduxState = {
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
export type BulkDeleteMetaWidgetPayload = {
  metaWidgetIds: string[];
};
type MetaWidgetPropertyUpdate = {
  path: string;
  value: unknown;
};

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
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
        state[metaWidgetId] = widgetProps;
        state[metaWidgetId].isMetaWidget = true;
        state[metaWidgetId].creatorId = creatorId;
      });
    }
    deleteIds.forEach((deleteId) => {
      if (state[deleteId].creatorId === creatorId) {
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
  [ReduxActionTypes.BULK_DELETE_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<BulkDeleteMetaWidgetPayload>,
  ) => {
    action.payload.metaWidgetIds.forEach((metaWidgetId) => {
      delete state[metaWidgetId];
    });

    return state;
  },
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: () => {
    return {};
  },
});

export default metaCanvasWidgetsReducer;
