export * from "ce/entities/DataTree/dataTreeModuleInstance";

import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type {
  JSModuleInstance,
  ModuleInstance,
  QueryModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";
import {
  EvaluationSubstitutionType,
  type QueryModuleInstanceEntityConfig,
  type QueryModuleInstanceEntity,
  type JSModuleInstanceEntity,
  type JSModuleInstanceEntityConfig,
  type MetaArgs,
} from "@appsmith/entities/DataTree/types";
import {
  isDynamicValue,
  type DependencyMap,
  type DynamicPath,
} from "utils/DynamicBindingUtils";
import { ENTITY_TYPE } from "@appsmith/entities/DataTree/types";
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

  if (moduleInstance.type === MODULE_TYPE.JS) {
    return generateJSModuleInstance(
      moduleInstance as JSModuleInstance,
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
  // moduleInstanceEntities.actions will have a single public action.
  const publicActions = moduleInstanceEntities.actions.filter(
    (action) =>
      action.config.isPublic &&
      action.config.moduleInstanceId === moduleInstance.id,
  );
  const publicAction = publicActions[0];
  const dynamicBindingPathList: DynamicPath[] = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};

  const dependencyMap: DependencyMap = {};
  dependencyMap[moduleInstance.name] = [];
  dependencyMap[moduleInstance.name].push(publicAction.config.name);

  bindingPaths["data"] = EvaluationSubstitutionType.TEMPLATE;
  dynamicBindingPathList.push({ key: "data" });

  const moduleInputs = moduleInstance.inputs;

  Object.keys(moduleInputs).forEach((moduleInput) => {
    bindingPaths[`inputs.${moduleInput}`] = EvaluationSubstitutionType.TEMPLATE;

    if (isDynamicValue(moduleInputs[moduleInput])) {
      dynamicBindingPathList.push({ key: `inputs.${moduleInput}` });
    }
  });

  return {
    unEvalEntity: {
      actionId: publicAction.config.id,
      clear: {},
      data: `{{${publicAction.config.name}.data}}`,
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INSTANCE,
      inputs: moduleInstance.inputs,
      isLoading: false,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      run: {},
      type: MODULE_TYPE.QUERY,
    },
    configEntity: {
      actionId: publicAction.config.id,
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INSTANCE,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      type: MODULE_TYPE.QUERY,
      name: moduleInstance.name,
      bindingPaths: bindingPaths,
      reactivePaths: {
        ...bindingPaths,
        isLoading: EvaluationSubstitutionType.TEMPLATE,
      },
      dynamicBindingPathList: dynamicBindingPathList,
      dependencyMap: dependencyMap,
    },
  };
};

export const generateJSModuleInstance = (
  moduleInstance: ModuleInstance,
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState,
): {
  unEvalEntity: JSModuleInstanceEntity;
  configEntity: JSModuleInstanceEntityConfig;
} => {
  const getPublicJSObject = moduleInstanceEntities.jsCollections.filter(
    (jsCollection) =>
      jsCollection.config.isPublic &&
      jsCollection.config.moduleInstanceId === moduleInstance.id,
  );

  const publicJSObject = getPublicJSObject && getPublicJSObject[0];
  const dynamicBindingPathList: DynamicPath[] = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const meta: Record<string, MetaArgs> = {};

  const dependencyMap: DependencyMap = {};
  dependencyMap[moduleInstance.name] = [];
  dependencyMap[moduleInstance.name].push(publicJSObject.config.name);

  const moduleInputs = moduleInstance.inputs;

  Object.keys(moduleInputs).forEach((moduleInput) => {
    bindingPaths[`inputs.${moduleInput}`] = EvaluationSubstitutionType.TEMPLATE;
    if (isDynamicValue(moduleInputs[moduleInput])) {
      dynamicBindingPathList.push({ key: `inputs.${moduleInput}` });
    }
  });
  const actions = publicJSObject.config.actions;
  const actionsData: Record<string, any> = {};

  const variables = publicJSObject.config.variables;
  const listVariables: Array<string> = [];
  const variableList: Record<string, unknown> = {};

  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      variableList[
        variable.name
      ] = `{{${publicJSObject.config.name}.${variable.name}}}`;
      listVariables.push(variable.name);
      dynamicBindingPathList.push({ key: variable.name });
      bindingPaths[variable.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
    }
  }

  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      bindingPaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
      bindingPaths[`${action.name}.data`] =
        EvaluationSubstitutionType.SMART_SUBSTITUTE;
      dynamicBindingPathList.push({ key: action.name });
      dynamicBindingPathList.push({ key: `${action.name}.data` });
      actionsData[action.name] = {
        data: `{{${publicJSObject.config.name}.${action.name}.data}}`,
      };
      meta[action.name] = {
        arguments: action.actionConfiguration.jsArguments,
        confirmBeforeExecute: !!action.confirmBeforeExecute,
      };
    }
  }

  return {
    unEvalEntity: {
      ...variableList,
      ...actionsData,
      actionId: publicJSObject.config.id,
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INSTANCE,
      type: MODULE_TYPE.JS,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      inputs: moduleInputs,
    },
    configEntity: {
      actionId: publicJSObject.config.id,
      ENTITY_TYPE: ENTITY_TYPE.MODULE_INSTANCE,
      type: MODULE_TYPE.JS,
      moduleId: moduleInstance.sourceModuleId,
      moduleInstanceId: moduleInstance.id,
      name: moduleInstance.name,
      bindingPaths: bindingPaths,
      reactivePaths: {
        ...bindingPaths,
      },
      publicEntityName: publicJSObject.config.name,
      variables: listVariables,
      dynamicBindingPathList: dynamicBindingPathList,
      dependencyMap: dependencyMap,
      meta: meta,
    },
  };
};
