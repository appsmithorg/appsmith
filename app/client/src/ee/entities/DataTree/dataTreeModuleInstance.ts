export * from "ce/entities/DataTree/dataTreeModuleInstance";

import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type {
  ModuleInstance,
  QueryModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";
import {
  EvaluationSubstitutionType,
  type QueryModuleInstanceEntityConfig,
  type QueryModuleInstanceEntity,
} from "@appsmith/entities/DataTree/types";
import {
  isDynamicValue,
  type DependencyMap,
  type DynamicPath,
} from "utils/DynamicBindingUtils";
import { ENTITY_TYPE_VALUE } from "@appsmith/entities/DataTree/types";
import type { ModuleInstanceEntitiesReducerState } from "@appsmith/reducers/entityReducers/moduleInstanceEntitiesReducer";

export const generateModuleInstance = (
  moduleInstance: ModuleInstance,
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState,
) => {
  if (moduleInstance.type === MODULE_TYPE.QUERY) {
    return generateQueryModuleInstance(
      moduleInstance as QueryModuleInstance,
      moduleInstanceEntities,
    );
  }

  return {
    configEntity: null,
    unEvalEntity: null,
  };
};

export const generateQueryModuleInstance = (
  moduleInstance: QueryModuleInstance,
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState,
): {
  unEvalEntity: QueryModuleInstanceEntity;
  configEntity: QueryModuleInstanceEntityConfig;
} => {
  const getPublicEntity = moduleInstanceEntities.actions.filter(
    (action) =>
      action.config.isPublic &&
      action.config.moduleInstanceId === moduleInstance.id,
  );
  const dynamicBindingPathList: DynamicPath[] = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};

  const dependencyMap: DependencyMap = {};
  dependencyMap[moduleInstance.name] = [];
  dependencyMap[moduleInstance.name].push(getPublicEntity[0].config.name);

  const moduleInputs = moduleInstance.inputs;

  Object.keys(moduleInputs).forEach((moduleInput) => {
    bindingPaths[`inputs.${moduleInput}`] = EvaluationSubstitutionType.TEMPLATE;
    if (isDynamicValue(moduleInputs[moduleInput])) {
      dynamicBindingPathList.push({ key: `inputs.${moduleInput}` });
    }
  });

  return {
    unEvalEntity: {
      actionId: getPublicEntity[0].config.id,
      clear: {},
      data: undefined,
      ENTITY_TYPE: ENTITY_TYPE_VALUE.MODULE_INSTANCE,
      inputs: moduleInstance.inputs,
      isLoading: false,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      run: {},
      type: MODULE_TYPE.QUERY,
    },
    configEntity: {
      actionId: getPublicEntity[0].config.id,
      ENTITY_TYPE: ENTITY_TYPE_VALUE.MODULE_INSTANCE,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      type: MODULE_TYPE.QUERY,
      name: moduleInstance.name,
      bindingPaths: bindingPaths,
      reactivePaths: {
        ...bindingPaths,
        data: EvaluationSubstitutionType.TEMPLATE,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
      },
      dynamicBindingPathList: dynamicBindingPathList,
      dependencyMap: dependencyMap,
    },
  };
};
