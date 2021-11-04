import { get, set } from "lodash";
import { Diff } from "deep-diff";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { Action, PluginType } from "entities/Action";

export type DSLDiff = Diff<CanvasWidgetsReduxState, CanvasWidgetsReduxState>;
export type ActionDiff = Diff<Action, Action>;

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
  "isCanvas",
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
export function processDiff<T>(
  entity: T,
  diff: Diff<T, T>,
  replay: any,
  isUndo: boolean,
) {
  if (!diff || !diff.path || !diff.path.length || diff.path[0] === "0") return;

  const entityId = diff.path[0];

  switch (diff.kind) {
    // new elements is added in dsl
    case "N":
      if (diff.path.length == 1) {
        const toast = createToast<T>(
          diff.rhs,
          entity,
          entityId,
          isUndo,
          !isUndo,
        );
        addToArray(replay, TOASTS, toast);
      } else {
        setPropertyUpdate(replay, [WIDGETS, entityId, UPDATES], diff.path);
      }
      break;
    // element is deleted in dsl
    case "D":
      if (diff.path.length == 1) {
        const toast = createToast<T>(
          diff.lhs,
          entity,
          entityId,
          isUndo,
          isUndo,
        );
        addToArray(replay, TOASTS, toast);
      } else {
        setPropertyUpdate(replay, [WIDGETS, entityId, UPDATES], diff.path);
      }
      break;
    // element is edited
    case "E":
      if (isPositionUpdate(diff.path[diff.path.length - 1])) {
        set(replay, [WIDGETS, entityId, FOCUSES], true);
      } else {
        setPropertyUpdate(replay, [WIDGETS, entityId, UPDATES], diff.path);
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
function createToast<T>(
  diffWidget: T,
  dslWidget: T,
  widgetId: string,
  isUndo: boolean,
  isCreated: boolean,
) {
  const widgetName = isCreated
    ? (diffWidget as any).widgetName
    : (dslWidget as any)[widgetId]?.widgetName;
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
 * checks the existing value and sets he propertyUpdate if required
 *
 * @param replay
 * @param path
 * @param value
 * @returns
 */
function setPropertyUpdate(replay: any, path: string[], value: string[]) {
  const existingPathValue = get(replay, path);

  if (!existingPathValue || existingPathValue.length > 2) {
    set(replay, path, value);
    set(replay, UPDATES, true);
  }
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

export enum ReplayEntityType {
  CANVAS,
  ACTION,
  DATASOURCE,
  JSACTION,
}

export function getReplayEntityType(entity: any) {
  if (entity && entity.pluginType === PluginType.JS)
    return ReplayEntityType.JSACTION;
  if (entity && entity.hasOwnProperty("actionConfiguration"))
    return ReplayEntityType.ACTION;
  return ReplayEntityType.CANVAS;
}
