import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  checkContainersForAutoHeightAction,
  setAutoHeightLayoutTreeAction,
} from "actions/autoHeightActions";
import log from "loglevel";
import { put, select } from "redux-saga/effects";
import { getAutoHeightLayoutTree } from "selectors/autoHeightSelectors";
import { getOccupiedSpacesGroupedByParentCanvas } from "selectors/editorSelectors";
import { TreeNode } from "utils/autoHeight/constants";
import { generateTree } from "utils/autoHeight/generateTree";
import { shouldWidgetsCollapse } from "./helpers";

export function* getLayoutTree(layoutUpdated: boolean) {
  const start = performance.now();

  const shouldCollapse: boolean = yield shouldWidgetsCollapse();
  const { canvasLevelMap, occupiedSpaces } = yield select(
    getOccupiedSpacesGroupedByParentCanvas,
  );

  // TODO PERF:(abhinav): Memoize this or something, in case the `UPDATE_LAYOUT` did not cause a change in
  // widget positions and sizes
  let tree: Record<string, TreeNode> = {};
  const previousTree: Record<string, TreeNode> = yield select(
    getAutoHeightLayoutTree,
  );
  for (const canvasWidgetId in occupiedSpaces) {
    if (occupiedSpaces[canvasWidgetId].length > 0) {
      const treeForThisCanvas = generateTree(
        occupiedSpaces[canvasWidgetId],
        !shouldCollapse && layoutUpdated,
        previousTree,
      );
      tree = Object.assign({}, tree, treeForThisCanvas);
    }
  }
  log.debug(
    "Dynamic Height: Tree generation time taken:",
    performance.now() - start,
    "ms",
  );
  return { canvasLevelMap, tree };
}

export function* generateTreeForAutoHeightComputations(
  action: ReduxAction<{
    shouldCheckContainersForAutoHeightUpdates: boolean;
    layoutUpdated: boolean;
  }>,
) {
  const { canvasLevelMap, tree } = yield getLayoutTree(
    action.payload.layoutUpdated,
  );
  yield put(setAutoHeightLayoutTreeAction(tree, canvasLevelMap));
  const { shouldCheckContainersForAutoHeightUpdates } = action.payload;

  if (shouldCheckContainersForAutoHeightUpdates) {
    yield put({
      type: ReduxActionTypes.PROCESS_AUTO_HEIGHT_UPDATES,
    });
    yield put(checkContainersForAutoHeightAction());
  }

  return tree;
}
