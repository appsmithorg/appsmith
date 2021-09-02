import { set, isString, has } from "lodash";
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

export const TOASTS = "toasts";
export const FOCUSES = "needsFocus";
export const UPDATES = "propertyUpdates";

export const WIDGETS = "widgets";

/**
 * this function update the replay object that holds info about change happened in widgets
 * also, it creates toast for new/deleted widgets on undo/redo
 *
 * @param dsl
 * @param diff
 * @param replay
 * @param isUndo
 * @returns
 */
export function processDiff(
  dsl: CanvasWidgetsReduxState,
  diff: DSLDiff,
  replay: any,
  isUndo: boolean,
) {
  if (!diff || !diff.path || !diff.path.length || diff.path[0] === "0") return;

  const widgetId = diff.path[0];

  switch (diff.kind) {
    // new elements is added in dsl
    case "N":
      if (diff.path.length == 1) {
        const toast = createToast(
          diff.rhs,
          dsl[widgetId],
          widgetId,
          isUndo,
          !isUndo,
        );
        addToArray(replay, TOASTS, toast);
      } else if (!has(replay, [WIDGETS, widgetId, UPDATES])) {
        set(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        set(replay, UPDATES, true);
      }
      break;
    // element is deleted in dsl
    case "D":
      if (diff.path.length == 1) {
        const toast = createToast(
          diff.lhs,
          dsl[widgetId],
          widgetId,
          isUndo,
          isUndo,
        );
        addToArray(replay, TOASTS, toast);
      } else if (!has(replay, [WIDGETS, widgetId, UPDATES])) {
        set(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        set(replay, UPDATES, true);
      }
      break;
    // element is edited
    case "E":
      const propertyName = diff.path[diff.path.length - 1];
      if (!isString(propertyName)) break;

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

/**
 * creates toast on undo/redo ( most used in addition/deletion of widgets )
 *
 * @param diffWidget
 * @param dslWidget
 * @param widgetId
 * @param isUndo
 * @param isCreated
 * @returns
 */
function createToast(
  diffWidget: CanvasWidgetsReduxState,
  dslWidget: CanvasWidgetsReduxState | undefined,
  widgetId: string,
  isUndo: boolean,
  isCreated: boolean,
) {
  const widgetName = isCreated ? diffWidget.widgetName : dslWidget?.widgetName;
  return {
    isCreated,
    isUndo,
    widgetName,
    widgetId,
  };
}

/**
 * checks property changed is a positional property
 *
 * @param widgetProperty
 * @returns
 */
function isPositionUpdate(widgetProperty: string) {
  return positionProps.indexOf(widgetProperty) !== -1;
}

/**
 * pushes value to array element in array of objects
 *
 * @param obj
 * @param key
 * @param value
 * @returns
 */
function addToArray(obj: any, key: string, value: any) {
  if (!obj) return;

  if (obj[key] && Array.isArray(obj[key])) {
    obj[key].push(value);
  } else {
    obj[key] = [value];
  }
}

/**
 * creates paths changed from diffs  array
 *
 * @param diffs
 * @returns
 */
export function getPathsFromDiff(diffs: any) {
  const paths = [];

  for (const diff of diffs) {
    paths.push(diff.path.join("."));
  }

  return paths;
}
