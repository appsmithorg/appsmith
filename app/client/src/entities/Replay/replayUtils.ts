import { get, isArray, isEmpty, set } from "lodash";
export const UPDATES = "propertyUpdates";
export const REPLAY_DELAY = 300;
export const TOASTS = "toasts";
export const FOCUSES = "needsFocus";
export const WIDGETS = "widgets";
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
  API,
  QUERY,
  SAAS,
  DATASOURCE,
  JSACTION,
  ACTION,
}

export function getReplayEntityType(entity: any) {
  if (entity && entity.hasOwnProperty("actionConfiguration")) {
    return ReplayEntityType.ACTION;
  }
  if (
    entity &&
    (entity.hasOwnProperty("datasourceConfiguration") ||
      entity.hasOwnProperty("datasourceId"))
  )
    return ReplayEntityType.DATASOURCE;
  if (entity && entity.hasOwnProperty("body")) return ReplayEntityType.JSACTION;
  return ReplayEntityType.CANVAS;
}

export function pathArrayToString(path?: string[]) {
  let stringPath = "";
  if (!path || path.length === 0) return stringPath;
  stringPath = path[0];
  for (let i = 1; i < path.length; i++) {
    stringPath += isNaN(parseInt(path[i])) ? `.${path[i]}` : `[${path[i]}]`;
  }
  return stringPath;
}

export function findFieldInfo(config: any, field: string, parentSection = "") {
  let result = {};
  if (!config || !isArray(config)) return result;
  for (const conf of config) {
    if (conf.configProperty === field) {
      result = { conf, parentSection };
      break;
    } else if (conf.children) {
      parentSection = conf.sectionName || parentSection;
      result = findFieldInfo(conf.children, field, parentSection);
      if (!isEmpty(result)) break;
    }
  }
  return result;
}
