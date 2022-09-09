import {
  DataTree,
  DataTreeJSAction,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { ParsedBody, ParsedJSSubAction } from "utils/JSPaneUtils";
import { unset, set, get } from "lodash";

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
  jsCollection: DataTreeJSAction,
  unEvalTree: DataTree,
) => {
  // jsCollection here means unEvalTree JSObject
  const modifiedUnEvalTree = unEvalTree;
  const functionsList: Array<string> = [];
  const varList: Array<string> = jsCollection.variables;
  Object.keys(jsCollection.meta).forEach((action) => {
    functionsList.push(action);
  });

  if (parsedBody.actions && parsedBody.actions.length > 0) {
    for (let i = 0; i < parsedBody.actions.length; i++) {
      const action = parsedBody.actions[i];
      if (jsCollection.hasOwnProperty(action.name)) {
        if (jsCollection[action.name] !== action.body) {
          const data = get(
            modifiedUnEvalTree,
            `${jsCollection.name}.${action.name}.data`,
            {},
          );
          set(
            modifiedUnEvalTree,
            `${jsCollection.name}.${action.name}`,
            new String(action.body),
          );

          set(
            modifiedUnEvalTree,
            `${jsCollection.name}.${action.name}.data`,
            data,
          );
        }
      } else {
        const reactivePaths = jsCollection.reactivePaths;
        reactivePaths[action.name] =
          EvaluationSubstitutionType.SMART_SUBSTITUTE;
        reactivePaths[`${action.name}.data`] =
          EvaluationSubstitutionType.TEMPLATE;
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.reactivePaths`,
          reactivePaths,
        );
        const dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList.push({ key: action.name });
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );
        const dependencyMap = jsCollection.dependencyMap;
        dependencyMap["body"].push(action.name);
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.dependencyMap`,
          dependencyMap,
        );
        const meta = jsCollection.meta;
        meta[action.name] = {
          arguments: action.arguments,
          isAsync: false,
          confirmBeforeExecute: false,
        };
        set(modifiedUnEvalTree, `${jsCollection.name}.meta`, meta);
        const data = get(
          modifiedUnEvalTree,
          `${jsCollection.name}.${action.name}.data`,
          {},
        );
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.${action.name}`,
          new String(action.body.toString()),
        );
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.${action.name}.data`,
          data,
        );
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
        const reactivePaths = jsCollection.reactivePaths;
        delete reactivePaths[oldActionName];
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.reactivePaths`,
          reactivePaths,
        );
        let dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList = dynamicBindingPathList.filter(
          (path) => path["key"] !== oldActionName,
        );
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );
        const dependencyMap = jsCollection.dependencyMap["body"];
        const removeIndex = dependencyMap.indexOf(oldActionName);
        if (removeIndex > -1) {
          const updatedDMap = dependencyMap.filter(
            (item) => item !== oldActionName,
          );
          set(
            modifiedUnEvalTree,
            `${jsCollection.name}.dependencyMap.body`,
            updatedDMap,
          );
        }
        const meta = jsCollection.meta;
        delete meta[oldActionName];
        set(modifiedUnEvalTree, `${jsCollection.name}.meta`, meta);
        unset(modifiedUnEvalTree[jsCollection.name], oldActionName);
        unset(modifiedUnEvalTree[jsCollection.name], `${oldActionName}.data`);
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
          set(
            modifiedUnEvalTree,
            `${jsCollection.name}.${newVar.name}`,
            newVar.value,
          );
        }
      } else {
        varList.push(newVar.name);
        const reactivePaths = jsCollection.reactivePaths;
        reactivePaths[newVar.name] =
          EvaluationSubstitutionType.SMART_SUBSTITUTE;
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.reactivePaths`,
          reactivePaths,
        );
        const dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList.push({ key: newVar.name });
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );

        set(modifiedUnEvalTree, `${jsCollection.name}.variables`, varList);
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.${newVar.name}`,
          newVar.value,
        );
      }
    }
    let newVarList: Array<string> = varList;
    for (let i = 0; i < varList.length; i++) {
      const varListItem = varList[i];
      const existsInParsed = parsedBody.variables.find(
        (item) => item.name === varListItem,
      );
      if (!existsInParsed) {
        const reactivePaths = jsCollection.reactivePaths;
        delete reactivePaths[varListItem];
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.reactivePaths`,
          reactivePaths,
        );

        let dynamicBindingPathList = jsCollection.dynamicBindingPathList;
        dynamicBindingPathList = dynamicBindingPathList.filter(
          (path) => path["key"] !== varListItem,
        );
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.dynamicBindingPathList`,
          dynamicBindingPathList,
        );

        newVarList = newVarList.filter((item) => item !== varListItem);
        unset(modifiedUnEvalTree[jsCollection.name], varListItem);
      }
    }
    if (newVarList.length) {
      set(modifiedUnEvalTree, `${jsCollection.name}.variables`, newVarList);
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
  entity: DataTreeJSAction,
) => {
  const modifiedDataTree: DataTree = unEvalTree;
  const functionsList: Array<string> = [];
  Object.keys(entity.meta).forEach((action) => {
    functionsList.push(action);
  });
  //removed variables
  const varList: Array<string> = entity.variables;
  set(modifiedDataTree, `${entity.name}.variables`, []);
  for (let i = 0; i < varList.length; i++) {
    const varName = varList[i];
    unset(modifiedDataTree[entity.name], varName);
  }
  //remove functions
  let dynamicBindingPathList = entity.dynamicBindingPathList;
  const reactivePaths = entity.reactivePaths;
  const meta = entity.meta;
  let dependencyMap = entity.dependencyMap["body"];
  for (let i = 0; i < functionsList.length; i++) {
    const actionName = functionsList[i];
    delete reactivePaths[actionName];
    delete meta[actionName];
    unset(modifiedDataTree[entity.name], actionName);
    dynamicBindingPathList = dynamicBindingPathList.filter(
      (path: any) => path["key"] !== actionName,
    );
    dependencyMap = dependencyMap.filter((item: any) => item !== actionName);
  }
  set(modifiedDataTree, `${entity.name}.reactivePaths`, reactivePaths);
  set(
    modifiedDataTree,
    `${entity.name}.dynamicBindingPathList`,
    dynamicBindingPathList,
  );
  set(modifiedDataTree, `${entity.name}.dependencyMap.body`, dependencyMap);
  set(modifiedDataTree, `${entity.name}.meta`, meta);
  return modifiedDataTree;
};
