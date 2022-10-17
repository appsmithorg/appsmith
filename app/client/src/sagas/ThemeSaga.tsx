import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { all, select, takeLatest } from "redux-saga/effects";
import localStorage from "utils/localStorage";
import { ThemeMode } from "selectors/themeSelectors";

export function* setThemeSaga(actionPayload: ReduxAction<ThemeMode>) {
  yield localStorage.setItem("THEME", actionPayload.payload);
}

import { AppState } from "@appsmith/reducers";
import { WidgetType } from "utils/WidgetFactory";
import boxIntersect from "box-intersect";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
interface WidgetPositionMap {
  left: number;
  right: number;
  top: number;
  bottom: number;
  type: WidgetType;
  minWidth: number;
}
interface WidgetPositionObj {
  [widgetId: string]: WidgetPositionMap;
}
const MIN_WIDTH_CONFIGS_PX: any = {
  CONTAINER_WIDGET: {
    minWidth: 448,
  },
  STAT_BOX: {
    minWidth: 448,
  },
  CHART_WIDGET: {
    minWidth: 448,
  },
  FORM_WIDGET: {
    minWidth: 448,
  },
  INPUT_WIDGET_V2: {
    minWidth: 224,
  },
  BUTTON_WIDGET_V2: {
    minWidth: 224,
  },
  TABLE_WIDGET_V2: {
    minWidth: 448,
  },
  TEXT_WIDGT: {
    minWidth: 128,
  },
};
export const getWidgetsPositionMap = (state: AppState): WidgetPositionObj => {
  const allWidgets = state.entities.canvasWidgets;
  const widgetPositionMap: WidgetPositionObj = Object.keys(allWidgets).reduce(
    (map, eachWidgetId) => {
      const eachWidget = allWidgets[eachWidgetId];
      const minWidth = MIN_WIDTH_CONFIGS_PX[eachWidget.type]?.minWidth || 448;
      return {
        ...map,
        [eachWidget.widgetId]: {
          top: eachWidget.topRow,
          bottom: eachWidget.bottomRow,
          left: eachWidget.leftColumn,
          right: eachWidget.rightColumn,
          type: eachWidget.type,
          minWidth,
        },
      };
    },
    {},
  );
  delete widgetPositionMap[MAIN_CONTAINER_WIDGET_ID];
  return widgetPositionMap;
};

function* traversal(
  action: ReduxAction<UpdateApplicationPayload & { id: string }>,
) {
  console.log("Mobile responsiveness:", { action });
  if (action.payload.appLayout?.type === "MOBILE") {
    const widgetMap: WidgetPositionObj = yield select(getWidgetsPositionMap);
    const spaces = Object.keys(widgetMap).map((widgetId) => ({
      left: widgetMap[widgetId].left,
      right: widgetMap[widgetId].right,
      top: widgetMap[widgetId].top,
      bottom: widgetMap[widgetId].bottom,
      id: widgetId,
    }));

    const rightMap = generateTree(spaces);

    spaces.sort((a, b) => a.top - b.top); // Sort based on position, top to bottom

    const topMostWidgetId = spaces[0].id;
    console.log(
      "Mobile responsiveness:",
      { widgetMap },
      { spaces },
      { rightMap },
    );
  }
}

export type TreeNode = {
  rights: string[];
  topRow: number;
  bottomRow: number;
};

type NodeSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
};

type Box = [number, number, number, number];
const MAX_BOX_SIZE = 448;

export function generateTree(spaces: NodeSpace[]): Record<string, TreeNode> {
  spaces.sort((a, b) => a.left - b.left); // Sort based on position, top to bottom
  const boxes: Box[] = spaces.map((space) => [
    space.left,
    space.top,
    space.right + MAX_BOX_SIZE,
    space.bottom,
  ]);

  const overlaps = boxIntersect(boxes);

  const rightMap = getOverlapMap(overlaps);

  const tree: Record<string, TreeNode> = {};
  for (let i = 0; i < spaces.length; i++) {
    const space = spaces[i];
    tree[space.id] = {
      rights: (rightMap[i] || []).map((id) => spaces[id].id),
      topRow: Math.floor(space.top),
      bottomRow: Math.ceil(space.bottom),
    };
  }

  return tree;
}

// Gets a list of widgets below and above for each widget
// Namely, the belowMap and aboveMap respectively.
function getOverlapMap(arr: [number, number][]) {
  const rightMap: Record<string, number[]> = {};

  // Iteration 1
  for (let i = 0; i < arr.length; i++) {
    const overlap = arr[i];
    if (overlap[0] > overlap[1]) {
      rightMap[overlap[1]] = [...(rightMap[overlap[1]] || []), overlap[0]];
    } else {
      rightMap[overlap[0]] = [...(rightMap[overlap[0]] || []), overlap[1]];
    }
  }
  return rightMap;
}

export default function* themeSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SET_THEME, setThemeSaga),
    takeLatest(ReduxActionTypes.UPDATE_APP_LAYOUT, traversal),
  ]);
}
