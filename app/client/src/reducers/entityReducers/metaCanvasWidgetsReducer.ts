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
};
export type DeleteChildMetaWidgetsPayload = {
  widgetIds: string[];
};

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<ModifyMetaWidgetPayload>,
  ) => {
    Object.entries(action.payload.addOrUpdate).forEach(
      ([metaWidgetId, widgetProps]) => {
        state[metaWidgetId] = widgetProps;
        state[metaWidgetId].isMetaWidget = true;
      },
    );

    action.payload.delete.forEach((deleteId) => {
      delete state[deleteId];
    });

    return state;
  },
  [ReduxActionTypes.DELETE_CHILD_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<DeleteChildMetaWidgetsPayload>,
  ) => {
    action.payload.widgetIds.forEach((deleteId) => {
      delete state[deleteId];
    });

    return state;
  },
});

export default metaCanvasWidgetsReducer;
