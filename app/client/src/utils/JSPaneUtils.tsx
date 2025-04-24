//check difference for after body change and parsing
import type { JSCollection, JSAction, Variable } from "entities/JSCollection";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionRunBehaviour } from "PluginActionEditor/constants/PluginActionConstants";

export interface ParsedJSSubAction {
  name: string;
  body: string;
  arguments: Array<Variable>;
}

export interface ParsedBody {
  actions: Array<ParsedJSSubAction>;
  variables: Array<Variable>;
}

export interface JSUpdate {
  id: string;
  parsedBody: ParsedBody | undefined;
}

export interface JSCollectionDifference {
  newActions: Partial<JSAction>[];
  updateActions: JSAction[];
  deletedActions: JSAction[];
  nameChangedActions: Array<{
    id: string;
    collectionId?: string;
    oldName: string;
    newName: string;
    pageId: string;
    moduleId?: string;
    workflowId?: string;
  }>;
  changedVariables: Variable[];
}

export const getDifferenceInJSCollection = (
  parsedBody: ParsedBody,
  jsAction: JSCollection,
): JSCollectionDifference => {
  const newActions: ParsedJSSubAction[] = [];
  const toBearchivedActions: JSAction[] = [];
  const toBeUpdatedActions: JSAction[] = [];
  const nameChangedActions = [];
  const toBeAddedActions: Partial<JSAction>[] = [];

  //check if body is changed and update if exists or
  // add to new array so it can be added to main collection
  if (parsedBody.actions && parsedBody.actions.length > 0) {
    for (let i = 0; i < parsedBody.actions.length; i++) {
      const action = parsedBody.actions[i];
      const preExisted = (jsAction.actions || []).find(
        (js) => js.name === action.name,
      );

      if (preExisted) {
        if (preExisted.actionConfiguration.body !== action.body) {
          toBeUpdatedActions.push({
            ...preExisted,
            actionConfiguration: {
              ...preExisted.actionConfiguration,
              body: action.body,
              jsArguments: action.arguments,
            },
          });
        }
      } else {
        newActions.push(action);
      }
    }
  }

  //create deleted action list
  if (jsAction.actions && jsAction.actions.length > 0 && parsedBody.actions) {
    for (let i = 0; i < jsAction.actions.length; i++) {
      const preAction = jsAction.actions[i];
      const existed = parsedBody.actions.find(
        (js: ParsedJSSubAction) => js.name === preAction.name,
      );

      if (!existed) {
        toBearchivedActions.push(preAction);
      }
    }
  }

  //check if new is name changed from deleted actions
  if (toBearchivedActions.length && newActions.length) {
    for (let i = 0; i < newActions.length; i++) {
      const nameChange = toBearchivedActions.find(
        (js) => js.actionConfiguration.body === newActions[i].body,
      );

      if (nameChange) {
        const updateExisting = jsAction.actions.find(
          (js) => js.id === nameChange.id,
        );

        if (updateExisting) {
          const indexOfArchived = toBearchivedActions.findIndex((js) => {
            js.id === updateExisting.id;
          });

          //will be part of new nameChangedActions for now
          toBeUpdatedActions.push({
            ...updateExisting,
            name: newActions[i].name,
          });
          nameChangedActions.push({
            id: updateExisting.id,
            collectionId: updateExisting.collectionId,
            oldName: updateExisting.name,
            newName: newActions[i].name,
            pageId: updateExisting.pageId,
            moduleId: updateExisting.moduleId,
            workflowId: updateExisting.workflowId,
          });
          newActions.splice(i, 1);
          toBearchivedActions.splice(indexOfArchived, 1);
        }
      }
    }
  }

  if (newActions.length > 0) {
    for (let i = 0; i < newActions.length; i++) {
      const action = newActions[i];
      const obj = {
        name: action.name,
        collectionId: jsAction.id,
        runBehavior: ActionRunBehaviour.MANUAL,
        pageId: jsAction.pageId,
        workspaceId: jsAction.workspaceId,
        actionConfiguration: {
          body: action.body,
          timeoutInMillisecond: 0,
          jsArguments: action.arguments || [],
        },
      };

      toBeAddedActions.push(obj);
    }
  }

  //change in variables. In cases the variable list is not present, jsAction.variables will be undefined
  // we are setting to empty array to avoid undefined errors further in the code (especially in case of workflows main file)
  const varList = jsAction.variables || [];
  let changedVariables: Array<Variable> = [];

  if (parsedBody.variables.length) {
    for (let i = 0; i < parsedBody.variables.length; i++) {
      const newVar = parsedBody.variables[i];
      const existedVar = varList.find((item) => item.name === newVar.name);

      if (!!existedVar) {
        const existedValue = existedVar.value;

        if (
          (!!existedValue &&
            existedValue.toString() !==
              (newVar.value && newVar.value.toString())) ||
          (!existedValue && !!newVar.value)
        ) {
          changedVariables.push(newVar);
        }
      } else {
        changedVariables.push(newVar);
      }
    }
  } else {
    changedVariables = varList;
  }

  //delete variable
  if (varList && varList.length > 0 && parsedBody.variables) {
    for (let i = 0; i < varList.length; i++) {
      const preVar = varList[i];
      const existed = parsedBody.variables.find(
        (jsVar: Variable) => jsVar.name === preVar.name,
      );

      if (!existed) {
        const newvarList = varList.filter(
          (deletedVar) => deletedVar.name !== preVar.name,
        );

        changedVariables = changedVariables.concat(newvarList);
      }
    }
  }

  return {
    newActions: toBeAddedActions,
    updateActions: toBeUpdatedActions,
    deletedActions: toBearchivedActions,
    nameChangedActions: nameChangedActions,
    changedVariables: changedVariables,
  };
};

export const pushLogsForObjectUpdate = (
  actions: Partial<JSAction>[],
  jsCollection: JSCollection,
  text: string,
) => {
  for (let i = 0; i < actions.length; i++) {
    AppsmithConsole.info({
      logType: LOG_TYPE.JS_ACTION_UPDATE,
      text: text,
      source: {
        type: ENTITY_TYPE.JSACTION,
        name: jsCollection.name + "." + actions[i].name,
        id: jsCollection.id,
      },
    });
  }
};

export const createDummyJSCollectionActions = (
  workspaceId: string,
  additionalParams: Record<string, unknown> = {},
) => {
  const body =
    "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}";

  const actions = [
    {
      name: "myFun1",
      workspaceId,
      runBehavior: ActionRunBehaviour.MANUAL,
      actionConfiguration: {
        body: "function () {}",
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
      clientSideExecution: true,
      ...additionalParams,
    },
    {
      name: "myFun2",
      workspaceId,
      runBehavior: ActionRunBehaviour.MANUAL,
      actionConfiguration: {
        body: "async function () {}",
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
      clientSideExecution: true,
      ...additionalParams,
    },
  ];

  const variables = [
    {
      name: "myVar1",
      value: "[]",
    },
    {
      name: "myVar2",
      value: "{}",
    },
  ];

  return {
    actions,
    body,
    variables,
  };
};

export const createSingleFunctionJsCollection = (
  workspaceId: string,
  functionName: string,
  additionalParams: Record<string, unknown> = {},
) => {
  const body = `export default {\n\t${functionName} () {\n\t\t//\twrite code here\n\t}\n}`;

  const actions = [
    {
      name: functionName,
      workspaceId,
      runBehavior: ActionRunBehaviour.MANUAL,
      actionConfiguration: {
        body: "function () {}",
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
      clientSideExecution: true,
      ...additionalParams,
    },
  ];

  const variables: Variable[] = [];

  return {
    actions,
    body,
    variables,
  };
};
