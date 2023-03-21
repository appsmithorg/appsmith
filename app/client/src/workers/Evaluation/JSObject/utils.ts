import type {
  ConfigTree,
  DataTree,
  AppsmithEntity,
} from "entities/DataTree/dataTreeFactory";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import type { ParsedBody, ParsedJSSubAction } from "utils/JSPaneUtils";
import { unset, set, get, find } from "lodash";
import type {
  BatchedJSExecutionData,
  BatchedJSExecutionErrors,
  JSCollectionData,
  JSExecutionData,
  JSExecutionError,
} from "reducers/entityReducers/jsActionsReducer";
import { select } from "redux-saga/effects";
import type { JSAction } from "entities/JSCollection";
import { getJSCollectionsForCurrentPage } from "selectors/entitiesSelector";
import {
  getEntityNameAndPropertyPath,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import type { APP_MODE } from "entities/App";
import type {
  JSActionEntityConfig,
  JSActionEntity,
} from "entities/DataTree/types";

/**
 * here we add/remove the properties (variables and actions) which got added/removed from the JSObject parsedBody.
  NOTE: For other entity below logic is maintained in DataTreeFactory, for JSObject we handle it inside evaluations
 * 
 * @param parsedBody 
 * @param jsCollection 
 * @param unEvalTree 
 * @returns 
 */
export const updateJSCollectionInUnEvalTree = (
  parsedBody: ParsedBody,
  jsCollection: JSActionEntity,
  unEvalTree: DataTree,
  configTree: ConfigTree,
  entityName: string,
) => {
  // jsCollection here means unEvalTree JSObject
  const modifiedUnEvalTree = unEvalTree;
  const functionsList: Array<string> = [];
  const jsEntityConfig = configTree[entityName] as JSActionEntityConfig;
  const varList: Array<string> = jsEntityConfig?.variables;
  Object.keys(jsEntityConfig?.meta).forEach((action) => {
    functionsList.push(action);
  });
  const oldConfig = jsEntityConfig;

  if (parsedBody.actions && parsedBody.actions.length > 0) {
    for (let i = 0; i < parsedBody.actions.length; i++) {
      const action = parsedBody.actions[i];
      if (jsCollection.hasOwnProperty(action.name)) {
        if (jsCollection[action.name] !== action.body) {
          const data = get(
            modifiedUnEvalTree,
            `${entityName}.${action.name}.data`,
            {},
          );
          set(
            modifiedUnEvalTree,
            `${entityName}.${action.name}`,
            new String(action.body),
          );

          set(modifiedUnEvalTree, `${entityName}.${action.name}.data`, data);
          set(oldConfig.meta?.[action.name], `isAsync`, action.isAsync);
        }
      } else {
        const reactivePaths = oldConfig.reactivePaths;

        reactivePaths[action.name] =
          EvaluationSubstitutionType.SMART_SUBSTITUTE;
        reactivePaths[`${action.name}.data`] =
          EvaluationSubstitutionType.TEMPLATE;

        const dynamicBindingPathList = oldConfig.dynamicBindingPathList;
        dynamicBindingPathList.push({ key: action.name });

        const dependencyMap = oldConfig.dependencyMap;
        dependencyMap["body"].push(action.name);

        const meta = oldConfig.meta;
        meta[action.name] = {
          arguments: action.arguments,
          isAsync: action.isAsync,
          confirmBeforeExecute: false,
        };

        const data = get(
          modifiedUnEvalTree,
          `${entityName}.${action.name}.data`,
          {},
        );
        set(
          modifiedUnEvalTree,
          `${entityName}.${action.name}`,
          new String(action.body.toString()),
        );
        set(modifiedUnEvalTree, `${entityName}.${action.name}.data`, data);
      }
    }
  }
  if (functionsList && functionsList.length > 0) {
    for (let i = 0; i < functionsList.length; i++) {
      const oldActionName = functionsList[i];
      const existed = parsedBody.actions.find(
        (js: ParsedJSSubAction) => js.name === oldActionName,
      );
      if (!existed) {
        const reactivePaths = oldConfig.reactivePaths;
        delete reactivePaths[oldActionName];

        oldConfig.dynamicBindingPathList =
          oldConfig.dynamicBindingPathList.filter(
            (path: any) => path["key"] !== oldActionName,
          );

        const dependencyMap = oldConfig.dependencyMap["body"];
        const removeIndex = dependencyMap.indexOf(oldActionName);
        if (removeIndex > -1) {
          oldConfig.dependencyMap["body"] = dependencyMap.filter(
            (item: any) => item !== oldActionName,
          );
        }
        const meta = oldConfig.meta;
        delete meta[oldActionName];

        unset(modifiedUnEvalTree[entityName], oldActionName);
        unset(modifiedUnEvalTree[entityName], `${oldActionName}.data`);
      }
    }
  }
  if (parsedBody.variables.length) {
    for (let i = 0; i < parsedBody.variables.length; i++) {
      const newVar = parsedBody.variables[i];
      const existedVar = varList.indexOf(newVar.name);
      if (existedVar > -1) {
        const existedVarVal = jsCollection[newVar.name];
        if (
          (!!existedVarVal && existedVarVal.toString()) !==
            (newVar.value && newVar.value.toString()) ||
          (!existedVarVal && !!newVar)
        ) {
          set(modifiedUnEvalTree, `${entityName}.${newVar.name}`, newVar.value);
        }
      } else {
        varList.push(newVar.name);
        const reactivePaths = oldConfig.reactivePaths;
        reactivePaths[newVar.name] =
          EvaluationSubstitutionType.SMART_SUBSTITUTE;

        const dynamicBindingPathList = oldConfig.dynamicBindingPathList;
        dynamicBindingPathList.push({ key: newVar.name });

        set(modifiedUnEvalTree, `${entityName}.variables`, varList);
        set(modifiedUnEvalTree, `${entityName}.${newVar.name}`, newVar.value);
      }
    }
    let newVarList: Array<string> = varList;
    for (let i = 0; i < varList.length; i++) {
      const varListItem = varList[i];
      const existsInParsed = parsedBody.variables.find(
        (item) => item.name === varListItem,
      );
      if (!existsInParsed) {
        const reactivePaths = oldConfig.reactivePaths;
        delete reactivePaths[varListItem];

        oldConfig.dynamicBindingPathList =
          oldConfig.dynamicBindingPathList.filter(
            (path: any) => path["key"] !== varListItem,
          );

        newVarList = newVarList.filter((item) => item !== varListItem);
        unset(modifiedUnEvalTree[entityName], varListItem);
      }
    }
    if (newVarList.length) {
      set(modifiedUnEvalTree, `${entityName}.variables`, newVarList);
    }
  }
  return modifiedUnEvalTree;
};

/**
 * When JSObject parseBody is empty we remove all variables and actions from unEvalTree
 * this will lead to removal of properties from the dataTree
 * @param unEvalTree
 * @param entity
 * @returns
 */
export const removeFunctionsAndVariableJSCollection = (
  unEvalTree: DataTree,
  entity: JSActionEntity,
  entityName: string,
  configTree: ConfigTree,
) => {
  // const oldConfig = Object.getPrototypeOf(entity) as JSActionEntity;
  const oldConfig = configTree[entityName] as JSActionEntityConfig;
  const modifiedDataTree: DataTree = unEvalTree;
  const functionsList: Array<string> = [];
  Object.keys(oldConfig.meta).forEach((action) => {
    functionsList.push(action);
  });
  //removed variables
  const varList: Array<string> = entity.variables;
  set(modifiedDataTree, `${entityName}.variables`, []);
  for (let i = 0; i < varList.length; i++) {
    const varName = varList[i];
    unset(modifiedDataTree[entityName], varName);
  }
  //remove functions

  const reactivePaths = entity.reactivePaths;
  const meta = entity.meta;

  for (let i = 0; i < functionsList.length; i++) {
    const actionName = functionsList[i];
    delete reactivePaths[actionName];
    delete meta[actionName];
    unset(modifiedDataTree[entityName], actionName);

    oldConfig.dynamicBindingPathList = oldConfig.dynamicBindingPathList.filter(
      (path: any) => path["key"] !== actionName,
    );

    oldConfig.dependencyMap["body"] = entity.dependencyMap["body"].filter(
      (item: any) => item !== actionName,
    );
  }

  return modifiedDataTree;
};

export function isJSObjectFunction(
  dataTree: DataTree,
  jsObjectName: string,
  key: string,
  configTree: ConfigTree,
) {
  const entityConfig = configTree[jsObjectName] as JSActionEntityConfig;
  const entity = dataTree[jsObjectName];
  if (isJSAction(entity)) {
    return entityConfig.meta.hasOwnProperty(key);
  }
  return false;
}

export function getAppMode(dataTree: DataTree) {
  const appsmithObj = dataTree.appsmith as AppsmithEntity;
  return appsmithObj.mode as APP_MODE;
}

export function isPromise(value: any): value is Promise<unknown> {
  return Boolean(value && typeof value.then === "function");
}

function updateJSExecutionError(
  errors: BatchedJSExecutionErrors,
  executionError: JSExecutionError,
) {
  const { collectionId } = executionError;
  if (errors[collectionId]) {
    errors[collectionId].push(executionError);
  } else {
    errors[collectionId] = [executionError];
  }
}

function updateJSExecutionData(
  sortedData: BatchedJSExecutionData,
  executionData: JSExecutionData,
) {
  const { collectionId } = executionData;
  if (sortedData[collectionId]) {
    sortedData[collectionId].push(executionData);
  } else {
    sortedData[collectionId] = [executionData];
  }
}

function getJSActionFromJSCollections(
  jsCollections: JSCollectionData[],
  jsfuncFullName: string,
) {
  const { entityName: collectionName, propertyPath: functionName } =
    getEntityNameAndPropertyPath(jsfuncFullName);

  const jsCollection = find(
    jsCollections,
    (collection) => collection.config.name === collectionName,
  );
  if (!jsCollection) return;

  const jsAction: JSAction | undefined = find(
    jsCollection.config.actions,
    (action) => action.name === functionName,
  );
  return jsAction;
}

export function* sortJSExecutionDataByCollectionId(
  data: Record<string, unknown>,
  errors: Record<string, unknown>,
) {
  // Sorted data by collectionId
  const sortedData: BatchedJSExecutionData = {};
  // Sorted errors by collectionId
  const sortedErrors: BatchedJSExecutionErrors = {};

  const JSCollectionsForCurrentPage: JSCollectionData[] = yield select(
    getJSCollectionsForCurrentPage,
  );

  for (const jsfuncFullName of Object.keys(data)) {
    const jsAction = getJSActionFromJSCollections(
      JSCollectionsForCurrentPage,
      jsfuncFullName,
    );
    if (!(jsAction && jsAction.collectionId)) continue;
    const { collectionId, id: actionId } = jsAction;

    if (errors[jsfuncFullName]) {
      updateJSExecutionError(sortedErrors, {
        collectionId,
        isDirty: true,
        actionId,
      });
    }

    updateJSExecutionData(sortedData, {
      collectionId,
      actionId,
      data: get(data, jsfuncFullName),
    });
  }

  return { sortedData, sortedErrors };
}
