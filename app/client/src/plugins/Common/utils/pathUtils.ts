import type { IEntity } from "../entity";
import { isDynamicEntity, isWidgetEntity } from "plugins/Common/entity";
import {
  convertPathToString,
  getEntityNameAndPropertyPath,
  isTrueObject,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { find, toPath, union } from "lodash";
import { EntityUtils } from "plugins/Common/utils/entityUtils";
import { EvaluationSubstitutionType } from "entities/DataTree/types";

export class PathUtils {
  static getReactivePaths(entity: IEntity, fullPath = true) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const reactivePaths = config.reactivePaths;
    if (!reactivePaths) return [];
    if (!fullPath) return Object.keys(reactivePaths);
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(reactivePaths),
      name,
    );
  }
  static getBindingPaths(entity: IEntity, fullPath = true) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const bindingPaths = config.bindingPaths;
    if (!bindingPaths) return [];
    if (!fullPath) return Object.keys(bindingPaths);
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(bindingPaths),
      name,
    );
  }

  static getInternalDependencyMap(entity: IEntity) {
    if (EntityUtils.isAction(entity) || EntityUtils.isJSAction(entity))
      return entity.getConfig().dependencyMap;
    return {};
  }

  static getTriggerPaths(entity: IEntity, fullPath = true) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const triggerPaths = config.triggerPaths;
    if (!triggerPaths) return [];
    if (!fullPath) return Object.keys(triggerPaths);
    return PathUtils.getFullNamesFromPropertyPaths(
      Object.keys(triggerPaths),
      name,
    );
  }

  static getDynamicBindingPaths(entity: IEntity) {
    if (!EntityUtils.isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    if (
      config &&
      config.dynamicBindingPathList &&
      Array.isArray(config.dynamicBindingPathList)
    ) {
      return config.dynamicBindingPathList;
    }
    return [];
  }

  static isPathADynamicBinding(entity: IEntity, path: string) {
    const dynamicBindingPaths = PathUtils.getDynamicBindingPaths(entity);
    return find(dynamicBindingPaths, { key: path }) !== undefined;
  }

  static isPathADynamicTrigger(entity: IEntity, path: string) {
    if (!isWidgetEntity(entity)) return false;
    const dynamicTriggerPaths = PathUtils.getDynamicTriggerPaths(entity);
    return find(dynamicTriggerPaths, { key: path }) !== undefined;
  }

  static getDynamicTriggerPaths(entity: IEntity) {
    if (!EntityUtils.isWidget(entity)) return [];
    const config = entity.getConfig();
    if (
      config &&
      config.dynamicTriggerPathList &&
      Array.isArray(config.dynamicTriggerPathList)
    ) {
      return config.dynamicTriggerPathList;
    }
    return [];
  }

  static getDynamicPaths(entity: IEntity, fullPath = true) {
    if (!isDynamicEntity(entity)) return [];
    const reactivePaths = PathUtils.getReactivePaths(entity, fullPath);
    const triggerPaths = PathUtils.getTriggerPaths(entity, fullPath);
    const bindingPaths = PathUtils.getBindingPaths(entity, fullPath);
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

  static getEntityNameAndPropertyPath(fullPath: string) {
    const indexOfFirstDot = fullPath.indexOf(".");
    if (indexOfFirstDot === -1) {
      // No dot was found so path is the entity name itself
      return {
        entityName: fullPath,
        propertyPath: "",
      };
    }
    const entityName = fullPath.substring(0, indexOfFirstDot);
    const propertyPath = fullPath.substring(indexOfFirstDot + 1);
    return { entityName, propertyPath };
  }
}
