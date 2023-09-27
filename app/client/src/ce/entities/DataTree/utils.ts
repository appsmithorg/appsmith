import type {
  PropertyOverrideDependency,
  OverridingPropertyPaths,
  ModuleInput,
  DataTreeEntity,
  WidgetEntity,
  ActionEntity,
  JSActionEntity,
  ConfigTree,
  UnEvalTree,
  DataTreeEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { OverridingPropertyType } from "@appsmith/entities/DataTree/types";
import {
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";

type SetOverridingPropertyParams = {
  key: string;
  value: string;
  propertyOverrideDependency: PropertyOverrideDependency;
  overridingPropertyPaths: OverridingPropertyPaths;
  type: OverridingPropertyType;
};

export const setOverridingProperty = ({
  key: propertyName,
  overridingPropertyPaths,
  propertyOverrideDependency,
  type,
  value: overridingPropertyKey,
}: SetOverridingPropertyParams) => {
  if (!(propertyName in propertyOverrideDependency)) {
    propertyOverrideDependency[propertyName] = {
      [OverridingPropertyType.DEFAULT]: undefined,
      [OverridingPropertyType.META]: undefined,
    };
  }
  switch (type) {
    case OverridingPropertyType.DEFAULT:
      propertyOverrideDependency[propertyName][OverridingPropertyType.DEFAULT] =
        overridingPropertyKey;
      break;

    case OverridingPropertyType.META:
      propertyOverrideDependency[propertyName][OverridingPropertyType.META] =
        overridingPropertyKey;

      break;
    default:
  }

  if (Array.isArray(overridingPropertyPaths[overridingPropertyKey])) {
    const updatedOverridingProperty = new Set(
      overridingPropertyPaths[overridingPropertyKey],
    );
    overridingPropertyPaths[overridingPropertyKey] = [
      ...updatedOverridingProperty.add(propertyName),
    ];
  } else {
    overridingPropertyPaths[overridingPropertyKey] = [propertyName];
  }
  // if property dependent on metaProperty also has defaultProperty then defaultProperty will also override metaProperty on eval.
  const defaultPropertyName = propertyOverrideDependency[propertyName].DEFAULT;
  if (type === OverridingPropertyType.META && defaultPropertyName) {
    overridingPropertyPaths[defaultPropertyName].push(overridingPropertyKey);
  }
};

export const generateDataTreeModuleInputs = (
  dataTree: UnEvalTree,
  configTree: ConfigTree,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moduleInputs: Record<string, ModuleInput>,
) => {
  return {
    dataTree,
    configTree,
  };
};

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entityConfig: DataTreeEntityConfig,
): entity is ActionEntity | WidgetEntity | JSActionEntity {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}
