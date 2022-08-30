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

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGET]: (
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
});

export default metaCanvasWidgetsReducer;
