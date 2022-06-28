import {
  DataTree,
  DataTreeJSAction,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { ParsedBody, ParsedJSSubAction } from "utils/JSPaneUtils";
import { unset, set, get } from "lodash";

const modifyUnEvalTreeForNewlyAddedJSAction = ({
  action,
  jsCollection,
  modifiedUnEvalTree,
}: {
  action: ParsedJSSubAction;
  jsCollection: DataTreeJSAction;
  modifiedUnEvalTree: DataTree;
}) => {
  // Add action to reactivePaths and update reactivePaths
  const reactivePaths = jsCollection.reactivePaths;
  reactivePaths[action.name] = EvaluationSubstitutionType.SMART_SUBSTITUTE;
  reactivePaths[`${action.name}.data`] = EvaluationSubstitutionType.TEMPLATE;
  set(modifiedUnEvalTree, `${jsCollection.name}.reactivePaths`, reactivePaths);

  // Add action to dynamicBindingPathList and update dynamicBindingPathList
  const dynamicBindingPathList = jsCollection.dynamicBindingPathList;
  dynamicBindingPathList.push({ key: action.name });
  set(
    modifiedUnEvalTree,
    `${jsCollection.name}.dynamicBindingPathList`,
    dynamicBindingPathList,
  );

  // Add action to dependencyMap and update dependencyMap
  const dependencyMap = jsCollection.dependencyMap;
  dependencyMap["body"].push(action.name);
  set(modifiedUnEvalTree, `${jsCollection.name}.dependencyMap`, dependencyMap);

  // Add action to meta object and update meta object
  const meta = jsCollection.meta;
  meta[action.name] = {
    arguments: action.arguments,
    isAsync: false,
    confirmBeforeExecute: false,
  };
  set(modifiedUnEvalTree, `${jsCollection.name}.meta`, meta);

  // Get the data received from unEvalTree and set it jsCollection
  const data = get(
    modifiedUnEvalTree,
    `${jsCollection.name}.${action.name}.data`,
    {},
  );
  set(modifiedUnEvalTree, `${jsCollection.name}.${action.name}.data`, data);

  // set the action body in jsCollection
  set(
    modifiedUnEvalTree,
    `${jsCollection.name}.${action.name}`,
    new String(action.body.toString()),
  );
};

const removeActionsFromUnEvalTree = ({
  actionsToRemove,
  jsCollection,
  modifiedUnEvalTree,
}: {
  actionsToRemove: Record<string, boolean>;
  jsCollection: DataTreeJSAction;
  modifiedUnEvalTree: DataTree;
}) => {
  const actionsToRemoveList = Object.keys(actionsToRemove);

  actionsToRemoveList.forEach((oldActionName) => {
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
    // update meta
    set(modifiedUnEvalTree, `${jsCollection.name}.meta`, meta);

    const deletedAction = unset(
      modifiedUnEvalTree[jsCollection.name],
      oldActionName,
    );
    const deletedActionData = unset(
      modifiedUnEvalTree[jsCollection.name],
      `${oldActionName}.data`,
    );
    console.log("$$$", { deletedAction, deletedActionData });
  });
};

export const updateJSCollectionInDataTree = (
  parsedBody: ParsedBody,
  jsCollection: DataTreeJSAction,
  unEvalTree: DataTree,
) => {
  // here we remove the properties (variables and actions) which got removed from the JSObject
  // parsedBody has new variables and actions list
  // jsCollection here means unEvalTree JSObject
  // for other entity below logic is maintained in DataTreeFactory of each entity.
  // for JSObject we handle it inside evaluations
  const modifiedUnEvalTree = unEvalTree;
  const oldVariableList: Array<string> = jsCollection.variables;

  // Here we add all the actions present in unEvalTree and then remove which are present in new parsedBody to get actionsToRemove
  const actionsToRemove: Record<string, boolean> = {};

  Object.keys(jsCollection.meta).forEach((action) => {
    actionsToRemove[action] = true;
  });

  // Add and edit action inside jsCollection
  for (let i = 0; i < parsedBody.actions.length; i++) {
    const action = parsedBody.actions[i];

    if (actionsToRemove[action.name]) {
      // As this action is present in the parsedBody, we will not remove it.
      // hence, we delete it from the list of actions to remove.
      delete actionsToRemove[action.name];
    }

    // check if jsCollection already has the action defined
    // which means that this is not newly added action
    if (jsCollection.hasOwnProperty(action.name)) {
      // check if current action body matches the previous action body
      // if it doesn't match then the user has modified the action body and hence
      // 1. We clear the data field and set it to empty object
      // 2. Add new body to jsCollection
      if (jsCollection[action.name] !== action.body) {
        const data = _.get(
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
      // if the action didn't exist in JSCollection
      // it means that this is newly add action
      // currently we mutate unEvalTree in our handle method. In future, we would like to move away from it.
      modifyUnEvalTreeForNewlyAddedJSAction({
        jsCollection,
        modifiedUnEvalTree,
        action,
      });
    }
  }

  removeActionsFromUnEvalTree({
    jsCollection,
    modifiedUnEvalTree,
    actionsToRemove,
  });

  if (parsedBody.variables.length) {
    for (let i = 0; i < parsedBody.variables.length; i++) {
      const newVar = parsedBody.variables[i];
      const existedVar = oldVariableList.indexOf(newVar.name);
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
        oldVariableList.push(newVar.name);
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
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.variables`,
          oldVariableList,
        );
        set(
          modifiedUnEvalTree,
          `${jsCollection.name}.${newVar.name}`,
          newVar.value,
        );
      }
    }
    let newVarList: Array<string> = oldVariableList;
    for (let i = 0; i < oldVariableList.length; i++) {
      const varListItem = oldVariableList[i];
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

        const deletedVarListItem = unset(
          modifiedUnEvalTree[jsCollection.name],
          varListItem,
        );
        console.log("$$$", { deletedVarListItem });
      }
    }
    if (newVarList.length) {
      set(modifiedUnEvalTree, `${jsCollection.name}.variables`, newVarList);
    }
  }
  console.log("$$$", modifiedUnEvalTree[jsCollection.name]);
  return modifiedUnEvalTree;
};

export const removeFunctionsAndVariableJSCollection = (
  dataTree: DataTree,
  entity: DataTreeJSAction,
) => {
  const modifiedDataTree: any = dataTree;
  const functionsList: Array<string> = [];
  Object.keys(entity.meta).forEach((action) => {
    functionsList.push(action);
  });
  //removed variables
  const varList: Array<string> = entity.variables;
  set(modifiedDataTree, `${entity.name}.variables`, []);
  for (let i = 0; i < varList.length; i++) {
    const varName = varList[i];
    delete modifiedDataTree[`${entity.name}`][`${varName}`];
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
    delete modifiedDataTree[`${entity.name}`][`${actionName}`];
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
