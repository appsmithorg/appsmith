import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

export type PseudoCanvasWidgetsReduxState = {
  [widgetId: string]: FlattenedWidgetProps;
};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

type AddPseudoWidgetPayload = Record<string, FlattenedWidgetProps>;

export type ModifyPseudoWidgetPayload = {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  delete: string[];
};

const initialState: PseudoCanvasWidgetsReduxState = {};

const pseudoCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_PSEUDO_WIDGET]: (
    state: PseudoCanvasWidgetsReduxState,
    action: ReduxAction<AddPseudoWidgetPayload>,
  ) => {
    Object.entries(action.payload).forEach(([pseudoWidgetId, widgetProps]) => {
      state[pseudoWidgetId] = widgetProps;
      state[pseudoWidgetId].isPseudoWidget = true;
    });
    return state;
  },
  [ReduxActionTypes.UPDATE_PSEUDO_WIDGET]: (
    state: PseudoCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.DELETE_PSEUDO_WIDGET]: (
    state: PseudoCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },

  [ReduxActionTypes.MODIFY_PSEUDO_WIDGET]: (
    state: PseudoCanvasWidgetsReduxState,
    action: ReduxAction<ModifyPseudoWidgetPayload>,
  ) => {
    Object.entries(action.payload.addOrUpdate).forEach(
      ([pseudoWidgetId, widgetProps]) => {
        state[pseudoWidgetId] = widgetProps;
        state[pseudoWidgetId].isPseudoWidget = true;
      },
    );

    action.payload.delete.forEach((deleteId) => {
      delete state[deleteId];
    });

    return state;
  },
});

export default pseudoCanvasWidgetsReducer;
