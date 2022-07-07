//check difference for after body change and parsing
import { JSCollection, JSAction, Variable } from "entities/JSCollection";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import AppsmithConsole from "utils/AppsmithConsole";

export type ParsedJSSubAction = {
  name: string;
  body: string;
  arguments: Array<Variable>;
  isAsync: boolean;
  // parsedFunction - used only to determine if function is async
  parsedFunction?: () => unknown;
};

export type ParsedBody = {
  actions: Array<ParsedJSSubAction>;
  variables: Array<Variable>;
};

export type JSUpdate = {
  id: string;
  parsedBody: ParsedBody | undefined;
};

export const getDifferenceInJSCollection = (
  parsedBody: ParsedBody,
  jsAction: JSCollection,
) => {
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
      const preExisted = jsAction.actions.find((js) => js.name === action.name);
      if (preExisted) {
        if (
          preExisted.actionConfiguration.body !== action.body ||
          preExisted.actionConfiguration.isAsync !== action.isAsync
        ) {
          toBeUpdatedActions.push({
            ...preExisted,
            actionConfiguration: {
              ...preExisted.actionConfiguration,
              body: action.body,
              jsArguments: action.arguments,
              isAsync: action.isAsync,
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
        executeOnLoad: false,
        pageId: jsAction.pageId,
        workspaceId: jsAction.workspaceId,
        actionConfiguration: {
          body: action.body,
          isAsync: action.isAsync,
          timeoutInMillisecond: 0,
          jsArguments: [],
        },
      };
      toBeAddedActions.push(obj);
    }
  }
  if (toBearchivedActions.length > 0) {
    for (let i = 0; i < toBearchivedActions.length; i++) {
      const action = toBearchivedActions[i];
      const deleteArchived = jsAction.actions.findIndex((js) => {
        action.id === js.id;
      });
      jsAction.actions.splice(deleteArchived, 1);
    }
  }
  //change in variables
  const varList = jsAction.variables;
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
    changedVariables = jsAction.variables;
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
  pageId: string,
  workspaceId: string,
) => {
  const body =
    "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}";

  const actions = [
    {
      name: "myFun1",
      pageId,
      workspaceId,
      executeOnLoad: false,
      actionConfiguration: {
        body: "() => {\n\t\t//write code here\n\t}",
        isAsync: false,
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
      clientSideExecution: true,
    },
    {
      name: "myFun2",
      pageId,
      workspaceId,
      executeOnLoad: false,
      actionConfiguration: {
        body: "async () => {\n\t\t//use async-await or promises\n\t}",
        isAsync: true,
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
      clientSideExecution: true,
    },
  ];
  return {
    actions,
    body,
  };
};
