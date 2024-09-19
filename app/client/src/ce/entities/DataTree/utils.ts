import type {
  PropertyOverrideDependency,
  OverridingPropertyPaths,
  WidgetEntity,
  ActionEntity,
  JSActionEntity,
} from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { OverridingPropertyType } from "ee/entities/DataTree/types";
import {
  isAction,
  isJSAction,
  isWidget,
} from "ee/workers/Evaluation/evaluationUtils";
import type { Module } from "ee/constants/ModuleConstants";
interface SetOverridingPropertyParams {
  key: string;
  value: string;
  propertyOverrideDependency: PropertyOverrideDependency;
  overridingPropertyPaths: OverridingPropertyPaths;
  type: OverridingPropertyType;
}

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moduleInputs: Module["inputsForm"],
) => {
  return {
    unEvalEntity: null,
    configEntity: null,
  };
};

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is ActionEntity | WidgetEntity | JSActionEntity {
  return isWidget(entity) || isAction(entity) || isJSAction(entity);
}
