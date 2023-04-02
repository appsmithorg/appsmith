import { ENTITY_TYPE } from "design-system-old";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import type {
  ActionEntity,
  AppsmithEntity,
  IEntity,
  JSEntity,
  WidgetEntity,
} from "lib/entity";
import EntityFactory from "lib/entity";

export type TDependencyGenerator = {
  generate(...args: unknown[]): Record<string, string[]>;
};

class DataDependencyGenerator {
  static generate(unEvalDataTree: DataTree, configTree: ConfigTree) {
    const dependencyMap = new Map<string, string[]>();
    const entityNames = Object.keys(unEvalDataTree);
    for (const entityName of entityNames) {
      const entity = EntityFactory.getEntity(unEvalDataTree[entityName]);
      const generator = DataDependencyFactory.getGenerator(entity);
      const dependencies = generator.generate(entity);
      const paths = Object.keys(dependencies);
      for (const dep of paths) {
        if (!dependencyMap.has(dep)) {
          dependencyMap.set(dep, []);
        }
        dependencyMap.get(dep)?.push(entityName);
      }
    }
  }
}

class DataDependencyFactory {
  static getGenerator(entity: IEntity): TDependencyGenerator {
    switch (entity.getType()) {
      case ENTITY_TYPE.WIDGET:
        return new WidgetDataDependency();
      case ENTITY_TYPE.ACTION:
        return new ActionDataDependency();
      case ENTITY_TYPE.JSACTION:
        return new JSDataDependency();
      default:
        return new DefaultDataDependency();
    }
  }
}

class WidgetDataDependency implements TDependencyGenerator {
  generate(entity: WidgetEntity) {
    return {};
  }
}

class ActionDataDependency implements TDependencyGenerator {
  generate(entity: ActionEntity) {
    return {};
  }
}

class JSDataDependency implements TDependencyGenerator {
  generate(entity: JSEntity) {
    return {};
  }
}

class DefaultDataDependency implements TDependencyGenerator {
  generate(entity: AppsmithEntity) {
    return {};
  }
}
