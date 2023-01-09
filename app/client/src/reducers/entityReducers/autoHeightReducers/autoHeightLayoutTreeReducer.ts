import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { TreeNode } from "utils/autoHeight/constants";
import { xor } from "lodash";

export type AutoHeightLayoutTreePayload = {
  tree: Record<string, TreeNode>;
  canvasLevelMap: Record<string, number>;
};

export type AutoHeightLayoutTreeReduxState = {
  [widgetId: string]: TreeNode;
};
const initialState: AutoHeightLayoutTreeReduxState = {};

const autoHeightLayoutTreeReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE]: (
    state: AutoHeightLayoutTreeReduxState,
    action: ReduxAction<AutoHeightLayoutTreePayload>,
  ) => {
    const { tree } = action.payload;
    const diff = xor(Object.keys(state), [...Object.keys(tree)]);
    for (const widgetId in diff) {
      delete state[widgetId];
    }
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
        state[widgetId].originalTopRow = tree[widgetId].originalTopRow;
        state[widgetId].originalBottomRow = tree[widgetId].originalBottomRow;
      } else {
        state[widgetId] = tree[widgetId];
      }
    }
  },
});

export default autoHeightLayoutTreeReducer;
