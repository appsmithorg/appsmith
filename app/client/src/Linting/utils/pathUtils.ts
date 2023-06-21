import type { TEntity } from "Linting/lib/entity";
import { isDynamicEntity, isWidgetEntity } from "Linting/lib/entity";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { union } from "lodash";

export class PathUtils {
  static getReactivePaths(entity: TEntity) {
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
  static getBindingPaths(entity: TEntity) {
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

  static getTriggerPaths(entity: TEntity) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const triggerPaths = config.triggerPaths;
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(triggerPaths),
      name,
    );
  }

  static getDynamicPaths(entity: TEntity) {
    if (!isDynamicEntity(entity)) return [];
    const reactivePaths = PathUtils.getReactivePaths(entity);
    const triggerPaths = PathUtils.getTriggerPaths(entity);
    const bindingPaths = PathUtils.getBindingPaths(entity);
    return union(reactivePaths, triggerPaths, bindingPaths);
  }
  static getFullNamesFromPropertyPaths(paths: string[], parentName: string) {
    return paths.map((path) => `${parentName}.${path}`);
  }
  static isDataPath(fullPath: string, entity: TEntity) {
    if (!isWidgetEntity(entity)) return false;
    const entityConfig = entity.getConfig();
    const { propertyPath } = getEntityNameAndPropertyPath(fullPath);
    return !(propertyPath in entityConfig.triggerPaths);
  }
  static getDataPaths(entity: TEntity) {
    if (!isWidgetEntity(entity)) return [];
    return PathUtils.getBindingPaths(entity);
  }
}
