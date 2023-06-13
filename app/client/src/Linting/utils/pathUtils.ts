import type { TEntity } from "Linting/lib/entity";
import { isDynamicEntity, isWidgetEntity } from "Linting/lib/entity";
import { union } from "lodash";

export class PathUtils {
  static getReactivePaths(entity: TEntity) {
    if (!isDynamicEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    const allReactivePaths = Object.keys(config.reactivePaths);
    if (isWidgetEntity(entity)) {
      allReactivePaths.push(...Object.keys(config.bindingPaths));
    }
    return allReactivePaths.map((p) => `${name}.${p}`);
  }

  static getTriggerPaths(entity: TEntity) {
    if (!isWidgetEntity(entity)) return [];
    const config = entity.getConfig();
    const name = entity.getName();
    return Object.keys(config.triggerPaths).map((p) => `${name}.${p}`);
  }

  static getDynamicPaths(entity: TEntity) {
    if (!isDynamicEntity(entity)) return [];
    const reactivePaths = PathUtils.getReactivePaths(entity);
    const triggerPaths = PathUtils.getTriggerPaths(entity);
    return union(reactivePaths, triggerPaths);
  }
}
