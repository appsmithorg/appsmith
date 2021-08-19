//check difference for after body change and parsing
import { JSAction, JSSubAction, variable } from "entities/JSAction";

export type ParsedJSSubAction = {
  name: string;
  body: string;
  arguments: Array<variable>;
};

export type ParsedBody = {
  actions: Array<ParsedJSSubAction>;
  variables: Array<variable>;
};

export const getDifferenceInJSAction = (
  parsedBody: ParsedBody,
  jsAction: JSAction,
) => {
  const newActions: ParsedJSSubAction[] = [];
  const toBearchivedActions: JSSubAction[] = [];
  const toBeupdatedActions: JSSubAction[] = [];
  const toBeAddedActions: Partial<JSSubAction>[] = [];
  //check if body is changed and update if exists or
  // add to new array so it can be added to main collection
  if (parsedBody.actions && parsedBody.actions.length > 0) {
    for (let i = 0; i < parsedBody.actions.length; i++) {
      const action = parsedBody.actions[i];
      const preExisted = jsAction.actions.find((js) => js.name === action.name);
      if (preExisted) {
        toBeupdatedActions.push({
          ...preExisted,
          actionConfiguration: {
            ...preExisted.actionConfiguration,
            body: action.body,
            jsArguments: action.arguments,
          },
        });
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
          toBeupdatedActions.push({
            ...updateExisting,
            name: newActions[i].name,
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
        organizationId: jsAction.organizationId,
        actionConfiguration: {
          body: action.body,
          isAsync: false,
          timeoutInMilliseconds: 0,
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
  return {
    newActions: toBeAddedActions,
    updateActions: toBeupdatedActions,
    deletedActions: toBearchivedActions,
  };
};
