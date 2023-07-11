import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { generateDataTreeAction } from "./dataTreeAction";

export const generateDataTreeModules = (
  module: any,
  editorConfigs: any,
  pluginDependencyConfig: any,
): any => {
  const dynamicBindingPathList: any = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};

  const dependencyMap: DependencyMap = {};
  dependencyMap[module.config.name] = [];
  dependencyMap[module.config.name].push(
    module.config.publicActions[0].config.name,
  );
  const actions = module.config.publicActions;
  let publicActionConfig,
    publicActionUneval = {};

  const inputs: Record<string, any> = {};

  const moduleInputs = module.config.inputs;

  Object.keys(moduleInputs).forEach((input) => {
    const val = moduleInputs[input];
    inputs[val.name] = val.value ? val.value : val.defaultValue;
    bindingPaths[val.name] = EvaluationSubstitutionType.TEMPLATE;
    if (val.value) {
      dynamicBindingPathList.push({ key: val.name });
    }
  });

  actions.forEach((action: any) => {
    const editorConfig = editorConfigs[action.config.pluginId];
    const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
    const { configEntity, unEvalEntity } = generateDataTreeAction(
      action,
      editorConfig,
      dependencyConfig,
    );
    publicActionConfig = configEntity;
    publicActionUneval = unEvalEntity;
  });

  const pc: any = {};
  pc[module.config.publicActions[0].config.name] = publicActionConfig;

  const pe: any = {};
  pe[module.config.publicActions[0].config.name] = publicActionUneval;

  const publicActions = [];
  publicActions.push(module.config.publicActions[0].config.name);

  return {
    unEvalEntity: {
      ENTITY_TYPE: ENTITY_TYPE.MODULE,
      moduleId: module.config.id,
      run: `${module.config.name}.${module.config.publicActions[0].config.name}.run`,
      ...pe,
      data: module.config.publicActions[0].data
        ? module.config.publicActions[0].data.body
        : undefined,
      ...inputs,
    },
    configEntity: {
      moduleId: module.config.id,
      name: module.config.name,
      ENTITY_TYPE: ENTITY_TYPE.MODULE,
      bindingPaths: bindingPaths,
      reactivePaths: { ...bindingPaths },
      dynamicBindingPathList: dynamicBindingPathList,
      dependencyMap: dependencyMap,
      publicActions: publicActions,
      ...pc,
    },
  };
};
