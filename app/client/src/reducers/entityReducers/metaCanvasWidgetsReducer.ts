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
  delete: string[];
  creatorId?: string;
};
export type BulkDeleteMetaWidgetPayload = {
  metaWidgetIds: string[];
};

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<ModifyMetaWidgetPayload>,
  ) => {
    if (action.payload.addOrUpdate) {
      Object.entries(action.payload.addOrUpdate).forEach(
        ([metaWidgetId, widgetProps]) => {
          state[metaWidgetId] = widgetProps;
          state[metaWidgetId].isMetaWidget = true;
          state[metaWidgetId].creatorId = action.payload.creatorId;
        },
      );
    }
    action.payload.delete.forEach((deleteId) => {
      if (state[deleteId].creatorId === action.payload.creatorId) {
        delete state[deleteId];
      }
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
});

export default metaCanvasWidgetsReducer;
