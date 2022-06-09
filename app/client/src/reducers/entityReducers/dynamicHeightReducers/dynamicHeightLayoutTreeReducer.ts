import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { TreeNode } from "utils/treeManipulationHelpers/dynamicHeightReflow";
import { xor } from "lodash";

export type DynamicHeightLayoutTreePayload = {
  tree: Record<string, TreeNode>;
  canvasLevelMap: Record<string, number>;
};

export type DynamicHeightLayoutTreeReduxState = {
  [widgetId: string]: TreeNode & { level?: number };
};
const initialState: DynamicHeightLayoutTreeReduxState = {};

const dynamicHeightLayoutTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_DYNAMIC_HEIGHT_LAYOUT_TREE]: (
    state: DynamicHeightLayoutTreeReduxState,
    action: ReduxAction<DynamicHeightLayoutTreePayload>,
  ) => {
    const { tree } = action.payload;
    for (const widgetId in tree) {
      if (state[widgetId]) {
        const differentAboves = xor(
          state[widgetId].aboves,
          tree[widgetId].aboves,
        );
        if (differentAboves.length > 0) {
          state[widgetId].aboves = tree[widgetId].aboves;
        }

        const differentBelows = xor(
          state[widgetId].belows,
          tree[widgetId].belows,
        );
        if (differentBelows.length > 0) {
          state[widgetId].belows = tree[widgetId].belows;
        }

        state[widgetId].topRow = tree[widgetId].topRow;
        state[widgetId].bottomRow = tree[widgetId].bottomRow;
      } else {
        state[widgetId] = tree[widgetId];
      }
    }
  },
});

export default dynamicHeightLayoutTreeReducer;
