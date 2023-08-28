import type { IEntity } from "../entity";
import type { WidgetEntity } from "../entity/WidgetEntity";
import type { JSEntity } from "../entity/JSEntity";
import type { ActionEntity } from "../entity/ActionEntity";
import { find, union } from "lodash";
import { PathUtils } from "plugins/Common/utils/pathUtils";
import { DependencyUtils } from "./dependencyUtils";
import { logPerformance } from "./logPerformance";

export class EntityUtils {
  static isDynamicEntity(
    entity: IEntity,
  ): entity is JSEntity | WidgetEntity | ActionEntity {
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
  static getEntityDependency(
    entity: IEntity,
    allKeys: Record<string, true>,
    propertyPath?: string,
  ) {
    const name = entity.getName();
    if (propertyPath)
      return EntityUtils.getEntityPathDependency(entity, allKeys, propertyPath);
    let dependencies: Record<string, string[]> = {};
    if (!EntityUtils.isDynamicEntity(entity)) return dependencies;
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

  private static getEntityPathDependency(
    entity: IEntity,
    allKeys: Record<string, true>,
    propertyPath: string,
  ) {
    const dependencies: Array<string> = [];
    const name = entity.getName();
    if (!EntityUtils.isDynamicEntity(entity))
      return { [`${name}.${propertyPath}`]: dependencies };
    const dynamicBindingPathList = PathUtils.getDynamicBindingPaths(entity);
    const reactivePaths = PathUtils.getReactivePaths(entity, false);
    const bindingPaths = PathUtils.getBindingPaths(entity, false);
    const internalDependencyMap = PathUtils.getInternalDependencyMap(entity);
    const widgetInternalDependencies =
      DependencyUtils.getDependencyFromInternalProperties(entity);
    const widgetInternalDependenciesForPath =
      widgetInternalDependencies[`${name}.${propertyPath}`] || [];
    dependencies.push(...widgetInternalDependenciesForPath);

    const internalDependenciesForPath =
      internalDependencyMap[propertyPath]
        ?.map((dep) => `${name}.${dep}`)
        .filter((path) => allKeys.hasOwnProperty(path)) || [];
    dependencies.push(...internalDependenciesForPath);

    const isPathADynamicPath =
      bindingPaths.includes(propertyPath) ||
      find(dynamicBindingPathList, { key: propertyPath }) ||
      reactivePaths.includes(propertyPath);

    if (!isPathADynamicPath)
      return { [`${name}.${propertyPath}`]: dependencies };

    dependencies.push(
      ...DependencyUtils.getDependenciesFromPath(entity, propertyPath),
    );
    return { [`${name}.${propertyPath}`]: dependencies };
  }

  static isDynamicLeaf(entity: IEntity, propertyPath: string) {
    if (!EntityUtils.isDynamicEntity(entity)) return false;
    if (!propertyPath) return false;
    const reactivePaths = PathUtils.getReactivePaths(entity, false);
    const triggerPaths = PathUtils.getTriggerPaths(entity, false);
    return (
      reactivePaths.includes(propertyPath) ||
      triggerPaths.includes(propertyPath)
    );
  }
}
