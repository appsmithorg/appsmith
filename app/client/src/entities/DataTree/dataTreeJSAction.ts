import {
  DataTreeJSAction,
  ENTITY_TYPE,
  JSActionProperty,
  MetaArgs,
} from "entities/DataTree/dataTreeFactory";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DependencyMap } from "utils/DynamicBindingUtils";
import memoize from "micro-memoize";
import { isTypeOfFunction, parseJSObjectWithAST } from "workers/ast";
import { debug } from "loglevel";
import { JSAction, Variable } from "entities/JSCollection";

const reg = /this\./g;

const getJSObjectProperties = ({
  actionsConfig,
  actionsData,
  body,
}: {
  body: string;
  actionsConfig: JSAction[];
  actionsData: JSCollectionData["data"];
}) => {
  const variables: Variable[] = [];
  const actions: Array<{
    name: string;
    body: string;
    arguments: Variable[];
  }> = [];
  const bodyWithoutExport = body.replace(/export default/g, "");
  const parseStartTime = performance.now();
  const actionsConfigMap: ActionsConfigMap = {};

  const parsedObject = parseJSObjectWithAST(bodyWithoutExport);
  const parseEndTime = performance.now();
  const JSObjectASTParseTime = parseEndTime - parseStartTime;
  debug({ JSObjectASTParseTime });

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

      const actionConfig = actionsConfig.find((config) => config.name === name);
      const data = actionConfig && actionsData && actionsData[actionConfig.id];
      const confirmBeforeExecute = !!(
        actionConfig && actionConfig.confirmBeforeExecute
      );
      // if edited an action
      actionsConfigMap[name] = {
        name,
        confirmBeforeExecute,
        arguments: params,
        isAsync: !!(actionConfig && actionConfig.actionConfiguration.isAsync),
        data,
        body: value,
      };
    } else if (type !== "literal") {
      variables.push({
        name,
        value,
      });
    }
  });

  return {
    actions,
    variables,
    actionsConfigMap,
  };
};

export const parseJSObjectMemoize = memoize(getJSObjectProperties, {
  maxSize: 1000,
});

type ActionsConfigMap = Record<string, JSActionProperty>;

const generateDataTreeJSActionMemoize = (
  js: JSCollectionData,
): DataTreeJSAction => {
  const meta: Record<string, MetaArgs> = {};
  const dynamicBindingPathList = [];
  const bindingPaths: Record<string, EvaluationSubstitutionType> = {};
  const variablesMap: Record<string, any> = {};

  const actionsConfig = js.config.actions;

  const listVariables: Array<string> = [];
  const bodyWithoutThisReference = js.config.body.replace(
    reg,
    `${js.config.name}.`,
  );

  dynamicBindingPathList.push({ key: "body" });

  bindingPaths["body"] = EvaluationSubstitutionType.SMART_SUBSTITUTE;

  const { actions, actionsConfigMap, variables } = parseJSObjectMemoize({
    body: bodyWithoutThisReference,
    actionsConfig,
    actionsData: js.data,
  });

  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      variablesMap[variable.name] = variable.value;
      listVariables.push(variable.name);
      dynamicBindingPathList.push({ key: variable.name });
      bindingPaths[variable.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
    }
  }
  const dependencyMap: DependencyMap = {};
  dependencyMap["body"] = [];

  const actionNames = [];
  const actionsData: Record<string, any> = {};
  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionConfig = actionsConfigMap[action.name];
      meta[action.name] = {
        arguments: action.arguments,
        isAsync: actionConfig.isAsync,
        confirmBeforeExecute: actionConfig.confirmBeforeExecute,
      };
      // As all js object function referred to as action is user javascript code, we add them as binding paths.
      bindingPaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
      dynamicBindingPathList.push({ key: action.name });
      dependencyMap["body"].push(action.name);
      actionsData[action.name] = {
        data: actionConfig.data,
      };
      actionNames.push(action.name);
    }
  }

  return {
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
    properties: {
      ...variablesMap,
      ...actionsData,
    },
    actionsConfig: actionsConfigMap,
  };
};

export const generateDataTreeJSAction = memoize(
  generateDataTreeJSActionMemoize,
  {
    maxSize: 1000,
  },
);
