export * from "ce/entities/DataTree/utils";
import type {
  ActionEntity,
  JSActionEntity,
  JSModuleInstanceEntity,
  ModuleInputsConfig,
  ModuleInputsEntity,
  QueryModuleInstanceEntity,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
import { isWidgetActionOrJsObject as CE_isWidgetActionOrJsObject } from "ce/entities/DataTree/utils";
import {
  isModuleInput,
  isModuleInstance,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { Module } from "@appsmith/constants/ModuleConstants";

//overriding this entire funtion
export const generateDataTreeModuleInputs = (
  inputsForm: Module["inputsForm"],
): {
  unEvalEntity: ModuleInputsEntity;
  configEntity: ModuleInputsConfig;
} => {
  const unEvalEntity: Record<string, string> = {};
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const dynamicBindingPathList = [];
  const moduleInputs = inputsForm[0].children || [];

  for (const moduleInput of moduleInputs) {
    const defaultValue = moduleInput.defaultValue || "";
    unEvalEntity[moduleInput.label] = defaultValue;
    bindingPaths[moduleInput.label] = EvaluationSubstitutionType.TEMPLATE;
    if (isDynamicValue(defaultValue)) {
      dynamicBindingPathList.push({ key: moduleInput.label });
    }
  }
  return {
    unEvalEntity: {
      ...unEvalEntity,
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INPUT,
    },
    configEntity: {
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INPUT,
      bindingPaths: bindingPaths, // As all js object function referred to as action is user javascript code, we add them as binding paths.
      reactivePaths: { ...bindingPaths },
      dynamicBindingPathList: dynamicBindingPathList,
      name: "inputs",
    },
  };
};

export function isWidgetActionOrJsObject(
  entity: DataTreeEntity,
): entity is
  | ActionEntity
  | WidgetEntity
  | JSActionEntity
  | ModuleInputsEntity
  | QueryModuleInstanceEntity
  | JSModuleInstanceEntity {
  return (
    CE_isWidgetActionOrJsObject(entity) ||
    isModuleInput(entity) ||
    isModuleInstance(entity)
  );
}
