import { get } from "lodash";
import type { IEntity } from "../entity";
import { EntityUtils } from "./entityUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";

export class DependencyUtils {
  static getDependenciesFromPath(entity: IEntity, propertyPath: string) {
    if (!EntityUtils.isDynamicEntity(entity)) return [];
    const rawEntity = entity.getRawEntity();
    const unevalPropValue = get(rawEntity, propertyPath, "").toString();
    if (EntityUtils.isJSAction(entity)) return [unevalPropValue];
    const { jsSnippets } = getDynamicBindings(
      unevalPropValue,
      rawEntity as DataTreeEntity,
    );
    const validJSSnippets = jsSnippets.filter((jsSnippet) => !!jsSnippet);

    return validJSSnippets;
  }

  static getDependencyFromInternalProperties(entity: IEntity) {
    if (!EntityUtils.isWidget(entity)) return {};
    const dependencies: Record<string, string[]> = {};
    const widgetConfig = entity.getConfig();
    const widgetName = entity.getName();
    const overrideEntries = Object.entries(
      widgetConfig.propertyOverrideDependency,
    );
    for (const entry of overrideEntries) {
      const [overriddenPropertyKey, overridingPropertyKeyMap] = entry;
      const existingDependenciesSet = new Set(
        dependencies[`${widgetName}.${overriddenPropertyKey}`] || [],
      );
      // add meta dependency
      overridingPropertyKeyMap.META &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.META}`,
        );
      // add default dependency
      overridingPropertyKeyMap.DEFAULT &&
        existingDependenciesSet.add(
          `${widgetName}.${overridingPropertyKeyMap.DEFAULT}`,
        );
      dependencies[`${widgetName}.${overriddenPropertyKey}`] = [
        ...existingDependenciesSet,
      ];
    }
    return dependencies;
  }
}
