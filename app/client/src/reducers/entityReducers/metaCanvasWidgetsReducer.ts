import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
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

type AddMetaWidgetPayload = Record<string, FlattenedWidgetProps>;

export type ModifyMetaWidgetPayload = {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  delete: string[];
};

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_META_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<AddMetaWidgetPayload>,
  ) => {
    Object.entries(action.payload).forEach(([metaWidgetId, widgetProps]) => {
      state[metaWidgetId] = widgetProps;
      state[metaWidgetId].isMetaWidget = true;
    });
    return state;
  },
  [ReduxActionTypes.UPDATE_META_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.DELETE_META_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },

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
