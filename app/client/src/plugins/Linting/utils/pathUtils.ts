import { isWidgetEntity } from "ee/plugins/Linting/lib/entity";
import {
  convertPathToString,
  getEntityNameAndPropertyPath,
  isTrueObject,
} from "ee/workers/Evaluation/evaluationUtils";
import { toPath, union } from "lodash";
import { isDynamicEntity } from "ee/plugins/Linting/lib/entity/isDynamicEntity";
import type { IEntity } from "ee/plugins/Linting/lib/entity/types";

export class PathUtils {
  static getReactivePaths(entity: IEntity) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const reactivePaths = config.reactivePaths;
    if (!reactivePaths) return [];

    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(reactivePaths),
      name,
    );
  }
  static getBindingPaths(entity: IEntity) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const bindingPaths = config.bindingPaths;
    if (!bindingPaths) return [];
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(bindingPaths),
      name,
    );
  }

  static getTriggerPaths(entity: IEntity) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const triggerPaths = config.triggerPaths;
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(triggerPaths),
      name,
    );
  }

  static getDynamicPaths(entity: IEntity) {
    if (!isDynamicEntity(entity)) return [];
    const reactivePaths = PathUtils.getReactivePaths(entity);
    const triggerPaths = PathUtils.getTriggerPaths(entity);
    const bindingPaths = PathUtils.getBindingPaths(entity);
    return union(reactivePaths, triggerPaths, bindingPaths);
  }
  static getFullNamesFromPropertyPaths(paths: string[], parentName: string) {
    return paths.map((path) => `${parentName}.${path}`);
  }
  static isDataPath(fullPath: string, entity: IEntity) {
    if (!isWidgetEntity(entity) || !this.isDynamicLeaf(entity, fullPath))
      return false;
    const entityConfig = entity.getConfig();
    const { propertyPath } = getEntityNameAndPropertyPath(fullPath);
    return !(propertyPath in entityConfig.triggerPaths);
  }
  static getDataPaths(entity: IEntity) {
    if (!isWidgetEntity(entity)) return [];
    return PathUtils.getBindingPaths(entity);
  }
  static isDynamicLeaf(entity: IEntity, fullPropertyPath: string) {
    const [entityName, ...propPathEls] = toPath(fullPropertyPath);
    // Framework feature: Top level items are never leaves
    if (entityName === fullPropertyPath) return false;

    const entityConfig = entity.getConfig() as Record<string, unknown>;
    if (!entityConfig) return false;
    const reactivePaths = entityConfig.reactivePaths as Record<string, unknown>;

    if (!isDynamicEntity(entity) || !entityConfig) return false;
    const relativePropertyPath = convertPathToString(propPathEls);
    return (
      relativePropertyPath in reactivePaths ||
      (isWidgetEntity(entity) &&
        relativePropertyPath in entity.getConfig().triggerPaths)
    );
  }

  static getAllPaths = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    records: any,
    curKey = "",
    result: Record<string, true> = {},
  ): Record<string, true> => {
    if (curKey) result[curKey] = true;
    if (Array.isArray(records)) {
      for (let i = 0; i < records.length; i++) {
        const tempKey = curKey ? `${curKey}[${i}]` : `${i}`;
        PathUtils.getAllPaths(records[i], tempKey, result);
      }
    } else if (isTrueObject(records)) {
      for (const key of Object.keys(records)) {
        const tempKey = curKey ? `${curKey}.${key}` : `${key}`;
        PathUtils.getAllPaths(records[key], tempKey, result);
      }
    }
    return result;
  };
}
