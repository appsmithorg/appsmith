import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export const WidgetBindingAccelerator = {
  SELF: "SELF",
  ONE_CLICK_BINDING: "ONE_CLICK_BINDING",
  NOT_DEFINED: "NOT_DEFINED",
} as const;

export type WidgetBindingAcceleratorType =
  (typeof WidgetBindingAccelerator)[keyof typeof WidgetBindingAccelerator];

export interface WidgetBindingAccelerators {
  [widgetId: string]: {
    [propertyName: string]: {
      accelerator: WidgetBindingAcceleratorType;
    };
  };
}

const initialState: WidgetBindingAccelerators = {};

const widgetBindingAcceleratorReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_WIDGET_BINDING_ACCELERATORS]: (
    state: WidgetBindingAccelerators,
    action: ReduxAction<{
      widgetId: string;
      propertyName: string;
      accelerator?: WidgetBindingAcceleratorType;
    }>,
  ) => {
    state[action.payload.widgetId] = {
      ...state[action.payload.widgetId],
      [action.payload.propertyName]: {
        accelerator:
          action.payload.accelerator || WidgetBindingAccelerator.NOT_DEFINED,
      },
    };
  },
  [ReduxActionTypes.RESET_WIDGET_BINDING_ACCELERATORS]: (
    state: WidgetBindingAccelerators,
    action: ReduxAction<{
      widgetId: string;
      propertyName: string;
    }>,
  ) => {
    if (state[action.payload.widgetId])
      delete state[action.payload.widgetId][action.payload.propertyName];
  },
});

export default widgetBindingAcceleratorReducer;
