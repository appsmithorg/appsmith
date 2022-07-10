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
  body,
  ranActionsData,
  savedActions,
  savedVariables,
}: {
  body: string;
  savedActions: JSAction[];
  ranActionsData: JSCollectionData["data"];
  savedVariables: Variable[];
}) => {
  const bodyWithoutExport = body.replace(/export default/g, "");
  const parseStartTime = performance.now();
  const variables: Variable[] = [];
  let actions: Array<{
    name: string;
    body: string;
    arguments: Variable[];
  }> = [];
  let actionsConfigMap: ActionsConfigMap = {};
  try {
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

        const actionConfig = savedActions.find(
          (config) => config.name === name,
        );
        const data =
          actionConfig && ranActionsData && ranActionsData[actionConfig.id];
        const confirmBeforeExecute = !!(
          actionConfig && actionConfig.confirmBeforeExecute
        );

        actionsConfigMap[name] = {
          name,
          confirmBeforeExecute,
          arguments: params,
          isAsync: !!(actionConfig && actionConfig.actionConfiguration.isAsync),
          data,
          body: value,
        };
        const parseEndTime = performance.now();
        const JSObjectASTParseTime = parseEndTime - parseStartTime;
        debug({ JSObjectASTParseTime });
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
  } catch (error) {
    // return last saved action and variables
    actionsConfigMap = {};
    actions = savedActions.map(
      ({ actionConfiguration, confirmBeforeExecute, id: actionId, name }) => {
        actionsConfigMap[name] = {
          name,
          confirmBeforeExecute: !!confirmBeforeExecute,
          arguments: actionConfiguration.jsArguments,
          isAsync: !!actionConfiguration.isAsync,
          data: ranActionsData && ranActionsData[actionId],
          body: actionConfiguration.body,
        };
        return {
          name,
          body: actionConfiguration.body,
          arguments: actionConfiguration.jsArguments,
        };
      },
    );

    return {
      actions,
      variables: savedVariables,
      actionsConfigMap,
    };
  }
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

  const savedActions = js.config.actions;
  const savedVariables = js.config.variables;
  const listVariables: Array<string> = [];
  const bodyWithoutThisReference = js.config.body.replace(
    reg,
    `${js.config.name}.`,
  );

  dynamicBindingPathList.push({ key: "body" });

  bindingPaths["body"] = EvaluationSubstitutionType.SMART_SUBSTITUTE;

  const { actions, actionsConfigMap, variables } = parseJSObjectMemoize({
    body: bodyWithoutThisReference,
    savedActions,
    savedVariables,
    ranActionsData: js.data,
  });

  if (variables) {
    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i];
      variablesMap[variable.name] = variable.value;
      listVariables.push(variable.name);

      const propertyPath = `properties.${variable.name}`;
      dynamicBindingPathList.push({ key: propertyPath });
      // check why variable smart substitution is not working
      bindingPaths[propertyPath] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
    }
  }
  const dependencyMap: DependencyMap = {};
  dependencyMap["body"] = [];

  const actionsReturnedData: Record<string, any> = {};
  if (actions) {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const actionConfig = actionsConfigMap[action.name];
      meta[action.name] = {
        // ideally we shouldn't use meta object for following values as these are not changed by app viewers
        // it should be moved to actionsConfig
        arguments: action.arguments,
        isAsync: actionConfig.isAsync,
        confirmBeforeExecute: actionConfig.confirmBeforeExecute,
      };

      actionsReturnedData[action.name] = {
        data: actionConfig.data,
      };

      const propertyPath = `properties.${action.name}`;
      // As all js object function referred to as action is user javascript code, we add them as binding paths.

      // actions are not bindings, verify it once
      // bindingPaths[propertyPath] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
      dynamicBindingPathList.push({ key: propertyPath });
      dependencyMap["body"].push(propertyPath);
    }
  }

  const JSObjectProperties = {
    ...variablesMap,
    ...actionsReturnedData,
  };

  const dependencyPathResolver: Record<string, string> = {};
  Object.keys(JSObjectProperties).forEach((propertyName) => {
    const propertyPath = `${js.config.name}.${propertyName}`;
    const actualPath = `${js.config.name}.properties.${propertyName}`;
    dependencyPathResolver[propertyPath] = actualPath;
  });

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
    dependencyPathResolver,
    properties: JSObjectProperties,
    actionsConfig: actionsConfigMap,
  };
};

export const generateDataTreeJSAction = memoize(
  generateDataTreeJSActionMemoize,
  {
    maxSize: 1000,
  },
);
