import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { TreeNode } from "utils/treeManipulationHelpers/dynamicHeightReflow";
import { xor } from "lodash";

export type DynamicHeightLayoutTreePayload = Record<string, TreeNode>;

export type DynamicHeightLayoutTreeReduxState = {
  [widgetId: string]: TreeNode;
};
const initialState: DynamicHeightLayoutTreeReduxState = {};

const dynamicHeightLayoutTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_DYNAMIC_HEIGHT_LAYOUT_TREE]: (
    state: DynamicHeightLayoutTreeReduxState,
    action: ReduxAction<DynamicHeightLayoutTreePayload>,
  ) => {
    for (const widgetId in action.payload) {
      if (state[widgetId]) {
        const differentAboves = xor(
          state[widgetId].aboves,
          action.payload[widgetId].aboves,
        );
        if (differentAboves.length > 0) {
          state[widgetId].aboves = action.payload[widgetId].aboves;
        }

        const differentBelows = xor(
          state[widgetId].belows,
          action.payload[widgetId].belows,
        );
        if (differentBelows.length > 0) {
          state[widgetId].belows = action.payload[widgetId].belows;
        }

        state[widgetId].topRow = action.payload[widgetId].topRow;
        state[widgetId].bottomRow = action.payload[widgetId].bottomRow;
      } else {
        state[widgetId] = action.payload[widgetId];
      }
    }
  },
});

export default dynamicHeightLayoutTreeReducer;
