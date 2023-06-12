import {
  type IEntity,
  isDynamicEntity,
  isWidgetEntity,
} from "Linting/lib/entity";

export class PathUtils {
  static getReactivePaths(entity: IEntity) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const allReactivePaths = Object.keys(config.reactivePaths);
    return allReactivePaths.map((p) => `${name}.${p}`);
  }

  static getBindingPaths(entity: IEntity) {
    const paths: string[] = [];
    if (!isWidgetEntity(entity)) return paths;
    const config = entity.getConfig();
    const name = entity.getName();
    return Object.keys(config.bindingPaths).map((p) => `${name}.${p}`);
  }

  static getTriggerPaths(entity: IEntity) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    return Object.keys(config.triggerPaths).map((p) => `${name}.${p}`);
  }

  static getPathsToLint(entity: IEntity) {
    const reactivePaths = PathUtils.getReactivePaths(entity);
    const triggerPaths = PathUtils.getTriggerPaths(entity);
    const bindingPaths = PathUtils.getBindingPaths(entity);
    return [...reactivePaths, ...triggerPaths, ...bindingPaths];
  }
}
