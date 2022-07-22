import {
  DataTreeJSAction,
  ENTITY_TYPE,
  MetaArgs,
} from "entities/DataTree/dataTreeFactory";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DependencyMap } from "utils/DynamicBindingUtils";
import memoize from "micro-memoize";
import { isTypeOfFunction, parseJSObjectWithAST } from "workers/ast";
import { debug } from "loglevel";
import { Variable } from "entities/JSCollection";

const reg = /this\./g;

const getJSObjectProperties = (body: string, jsObjectName: string) => {
  const bodyWithoutExport = body.replace(/export default/g, "");
  const parseStartTime = performance.now();
  const variables: Variable[] = [];
  const actions: Array<{
    name: string;
    body: string;
    arguments: Variable[];
  }> = [];

  const parsedObject = parseJSObjectWithAST(bodyWithoutExport);
  parsedObject.forEach(({ arguments: args, key: name, type, value }) => {
    if (isTypeOfFunction(type)) {
      let params: Variable[] = [];
      if (args && args.length) {
        params = args.map(({ defaultValue, paramName }) => ({
          name: paramName,
          value: defaultValue,
        }));
      }
      actions.push({
        name,
        body: value, // functionString
        arguments: params,
      });
    } else if (type !== "literal") {
      variables.push({
        name,
        value,
      });
    }
  });

  const parseEndTime = performance.now();
  const JSObjectASTParseTime = parseEndTime - parseStartTime;
  debug(`${jsObjectName} parse time ${JSObjectASTParseTime.toFixed(2)} ms`);
  return {
    actions,
    variables,
  };
};

export const parseJSObjectMemoize = memoize(getJSObjectProperties, {
  maxSize: 100,
});

export const generateDataTreeJSAction = (
  js: JSCollectionData,
): DataTreeJSAction => {
  const meta: Record<string, MetaArgs> = {};
  const dynamicBindingPathList = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const variablesMap: Record<string, any> = {};

  const savedActions = js.config.actions;
  const savedVariables = js.config.variables;
  const ranActionsData = js.data;
  const listVariables: Array<string> = [];
  const bodyWithoutThisReference = js.config.body.replace(
    reg,
    `${js.config.name}.`,
  );

  bindingPaths["body"] = EvaluationSubstitutionType.TEMPLATE;

  let variables: Variable[] = [];
  let actions: Array<{
    name: string;
    body: string;
    arguments: Variable[];
  }> = [];

  try {
    const jsObjectProps = parseJSObjectMemoize(
      bodyWithoutThisReference,
      js.config.name,
    );
    variables = jsObjectProps.variables;
    actions = jsObjectProps.actions;
  } catch (error) {
    // return last saved action and variables
    actions = savedActions.map(({ actionConfiguration, name }) => {
      return {
        name,
        body: actionConfiguration.body,
        arguments: actionConfiguration.jsArguments,
      };
    });
    variables = savedVariables;
  }

  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      variablesMap[variable.name] = variable.value;
      listVariables.push(variable.name);

      // Paths that need to evaluate are added as dynamicBinding
      // we want to only evaluate variables in case of JSObject
      dynamicBindingPathList.push({ key: variable.name });
      bindingPaths[variable.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
    }
  }

  const dependencyMap: DependencyMap = {};
  dependencyMap["body"] = [];

  const actionsData: Record<string, any> = {};

  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const { arguments: args, body, name: actionName } = actions[i];
      const actionConfig = savedActions.find(
        (config) => config.name === actionName,
      );

      let data: unknown = undefined;
      let confirmBeforeExecute = false;
      let isAsync = false;
      if (actionConfig) {
        data = ranActionsData && ranActionsData[actionConfig.id];
        confirmBeforeExecute = !!actionConfig.confirmBeforeExecute;
        isAsync = !!actionConfig.actionConfiguration.isAsync;
      }

      meta[actionName] = {
        arguments: args,
        isAsync: isAsync,
        confirmBeforeExecute,
      };

      actionsData[actionName] = body;
      actionsData[`${actionName}.data`] = data;

      bindingPaths[actionName] = EvaluationSubstitutionType.TEMPLATE;
      bindingPaths[`${actionName}.data`] = EvaluationSubstitutionType.TEMPLATE;

      dependencyMap["body"].push(actionName);
    }
  }

  return {
    ...variablesMap,
    name: js.config.name,
    actionId: js.config.id,
    pluginType: js.config.pluginType,
    ENTITY_TYPE: ENTITY_TYPE.JSACTION,
    body: bodyWithoutThisReference,
    meta: meta,
    bindingPaths: bindingPaths,
    reactivePaths: { ...bindingPaths },
    dynamicBindingPathList: dynamicBindingPathList,
    variables: listVariables,
    dependencyMap: dependencyMap,
    ...actionsData,
  };
};
