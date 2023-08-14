import type { IEntity } from "../entity";
import type { WidgetEntity } from "../entity/WidgetEntity";
import type { JSEntity } from "../entity/JSEntity";
import type { ActionEntity } from "../entity/ActionEntity";
import { union } from "lodash";
import { PathUtils } from "plugins/Linting/utils/pathUtils";
import { DependencyUtils } from "./dependencyUtils";
import { logPerformance } from "./logPerformance";

export class EntityUtils {
  static isDynamicEntity(entity: IEntity) {
    return (
      EntityUtils.isWidget(entity) ||
      EntityUtils.isAction(entity) ||
      EntityUtils.isJSAction(entity)
    );
  }
  static isWidget(entity: IEntity): entity is WidgetEntity {
    return entity.getType() === "WIDGET";
  }
  static isJSAction(entity: IEntity): entity is JSEntity {
    return entity.getType() === "JSACTION";
  }
  static isAction(entity: IEntity): entity is ActionEntity {
    return entity.getType() === "ACTION";
  }
  static getValidationDependencies(entity: IEntity) {
    const validationDeps: Record<string, string[]> = {};
    if (!EntityUtils.isWidget(entity)) return validationDeps;
    const config = entity.getConfig();
    const { validationPaths } = config;
    const entityName = entity.getName();
    const pathEntries = Object.entries(validationPaths);
    for (const entry of pathEntries) {
      const [propertyPath, validationConfig] = entry;
      if (!validationConfig.dependentPaths) continue;
      const dependencyArray = validationConfig.dependentPaths.map(
        (path) => `${entityName}.${path}`,
      );
      validationDeps[`${entityName}.${propertyPath}`] = dependencyArray;
    }
    return validationDeps;
  }

  @logPerformance
  static getEntityDependencies(entity: IEntity, allKeys: Record<string, true>) {
    let dependencies: Record<string, string[]> = {};
    if (!EntityUtils.isDynamicEntity(entity)) return dependencies;
    const name = entity.getName();
    const dynamicBindingPathList = PathUtils.getDynamicBindingPaths(entity);
    const dynamicTriggerPathList = PathUtils.getDynamicTriggerPaths(entity);
    const reactivePaths = PathUtils.getReactivePaths(entity, false);
    const internalDependencyMap = PathUtils.getInternalDependencyMap(entity);
    const widgetInternalDependencies =
      DependencyUtils.getDependencyFromInternalProperties(entity);
    dependencies = { ...widgetInternalDependencies };
    for (const { key } of dynamicTriggerPathList) {
      dependencies[`${name}.${key}`] = [];
    }

    for (const entry of Object.entries(internalDependencyMap)) {
      const [propertyPath, pathDeps] = entry;
      const fullPropertyPath = `${name}.${propertyPath}`;
      const propertyPathDependencies: string[] = pathDeps
        .map((dependentPath) => `${name}.${dependentPath}`)
        .filter((path) => allKeys.hasOwnProperty(path));
      dependencies[fullPropertyPath] = propertyPathDependencies;
    }

    for (const bindingPath of dynamicBindingPathList) {
      const propertyPath = bindingPath.key;
      const fullPropertyPath = `${name}.${propertyPath}`;
      const dynamicPathDependencies = DependencyUtils.getDependenciesFromPath(
        entity,
        propertyPath,
      );
      const existingDeps = dependencies[fullPropertyPath] || [];
      const newDeps = union(existingDeps, dynamicPathDependencies);
      dependencies = { ...dependencies, [fullPropertyPath]: newDeps };
    }

    for (const reactivePath of reactivePaths) {
      const fullPath = `${name}.${reactivePath}`;
      const reactivePathDependencies = DependencyUtils.getDependenciesFromPath(
        entity,
        reactivePath,
      );
      const existingDeps = dependencies[fullPath] || [];
      const newDeps = union(existingDeps, reactivePathDependencies);
      dependencies = { ...dependencies, [fullPath]: newDeps };
    }
    return dependencies;
  }
}
