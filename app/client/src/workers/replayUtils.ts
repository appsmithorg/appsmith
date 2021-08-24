import { set } from "lodash";
import { Diff } from "deep-diff";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

export type DSLDiff = Diff<CanvasWidgetsReduxState, CanvasWidgetsReduxState>;

const positionProps = [
  "leftColumn",
  "rightColumn",
  "topRow",
  "bottomRow",
  "minHeight",
  "parentColumnSpace",
  "parentRowSpace",
  "children",
  "parentId",
  "renderMode",
  "detachFromLayout",
  "noContainerOffset",
];

const TOAST = "toasts";
const FOCUSES = "needsFocus";
const UPDATES = "propertyUpdates";

const WIDGETS = "widgets";

export function processDiff(
  dsl: CanvasWidgetsReduxState,
  diff: DSLDiff,
  replay: any,
  isUndo: boolean,
) {
  if (!diff || !diff.path || !diff.path.length || diff.path[0] === "0") return;

  const widgetId = diff.path[0];

  switch (diff.kind) {
    case "N":
      if (diff.path.length == 1) {
        const toast = createToast(diff.rhs, dsl[widgetId], isUndo, !isUndo);
        addToArray(replay, TOAST, toast);
      } else {
        set(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        set(replay, UPDATES, true);
      }
      break;
    case "D":
      if (diff.path.length == 1) {
        const toast = createToast(diff.lhs, dsl[widgetId], isUndo, isUndo);
        addToArray(replay, TOAST, toast);
      } else {
        set(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        set(replay, UPDATES, true);
      }
      break;
    case "E":
      if (isPositionUpdate(diff.path[diff.path.length - 1])) {
        set(replay, [WIDGETS, widgetId, FOCUSES], true);
      } else {
        set(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        set(replay, UPDATES, true);
      }
      break;
    default:
      break;
  }
}

function createToast(
  diffWidget: CanvasWidgetsReduxState,
  dslWidget: CanvasWidgetsReduxState | undefined,
  isUndo: boolean,
  isCreated: boolean,
) {
  const widgetName = isCreated ? diffWidget.widgetName : dslWidget?.widgetName;
  return {
    isCreated,
    isUndo,
    widgetName,
  };
}

function isPositionUpdate(widgetProperty: string | number) {
  if (typeof widgetProperty == "number") return true;

  return positionProps.indexOf(widgetProperty) !== -1;
}

function addToArray(obj: any, key: string, value: any) {
  if (!obj) return;

  if (obj[key] && Array.isArray(obj[key])) {
    obj[key].push(value);
  } else {
    obj[key] = [value];
  }
}
