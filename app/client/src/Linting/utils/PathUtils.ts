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
    if (isWidgetEntity(entity)) {
      allReactivePaths.push(...Object.keys(config.bindingPaths));
    }
    return allReactivePaths.map((p) => `${name}.${p}`);
  }

  static getTriggerPaths(entity: IEntity) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    return Object.keys(config.triggerPaths).map((p) => `${name}.${p}`);
  }
}
