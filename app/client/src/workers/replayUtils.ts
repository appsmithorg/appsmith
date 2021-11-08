import { get, set } from "lodash";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { PluginType } from "entities/Action";
export const UPDATES = "propertyUpdates";

/**
 * checks the existing value and sets he propertyUpdate if required
 *
 * @param replay
 * @param path
 * @param value
 * @returns
 */
export function setPropertyUpdate(
  replay: any,
  path: string[],
  value: string[],
) {
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
export function addToArray(obj: any, key: string, value: any) {
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
