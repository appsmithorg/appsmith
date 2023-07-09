import { getActionChildrenPeekData } from "./Action";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import type { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { getWidgetChildrenPeekData } from "./Widget";
import { getJsActionPeekData } from "./JsAction";
import { getAppsmithPeekData } from "./Appsmith";
import {
  isActionEntity,
  isWidgetEntity,
} from "components/editorComponents/CodeEditor/codeEditorUtils";
import {
  isAppsmithEntity,
  isJSAction,
} from "@appsmith/workers/Evaluation/evaluationUtils";

export const filterInternalProperties = (
  objectName: string,
  dataTreeEntity: DataTreeEntity,
  jsActions: JSCollectionDataState,
  dataTree: DataTree,
  configTree: ConfigTree,
) => {
  if (!dataTreeEntity) return;
  if (isActionEntity(dataTreeEntity)) {
    return getActionChildrenPeekData(objectName, dataTree)?.peekData;
  } else if (isAppsmithEntity(dataTreeEntity)) {
    return getAppsmithPeekData(dataTree).peekData;
  } else if (isJSAction(dataTreeEntity)) {
    const jsAction = jsActions.find(
      (jsAction) => jsAction.config.id === dataTreeEntity.actionId,
    );
    return jsAction
      ? getJsActionPeekData(jsAction, dataTree)?.peekData
      : dataTreeEntity;
  } else if (isWidgetEntity(dataTreeEntity)) {
    return getWidgetChildrenPeekData(
      objectName,
      dataTreeEntity.type,
      dataTree,
      configTree,
    )?.peekData;
  }
  return dataTreeEntity;
};
