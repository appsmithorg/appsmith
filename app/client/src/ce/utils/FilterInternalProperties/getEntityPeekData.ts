import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { ActionEntity, WidgetEntity } from "ee/entities/DataTree/types";
import { getActionChildrenPeekData } from "utils/FilterInternalProperties/Action";
import { getAppsmithPeekData } from "utils/FilterInternalProperties/Appsmith";
import { getJsActionPeekData } from "utils/FilterInternalProperties/JsAction";
import { getWidgetChildrenPeekData } from "utils/FilterInternalProperties/Widget";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";

export const getEntityPeekData: Record<
  string,
  (props: {
    objectName: string;
    dataTreeEntity: DataTreeEntity;
    jsActions: JSCollectionDataState;
    dataTree: DataTree;
    configTree: ConfigTree;
  }) => unknown
> = {
  [ENTITY_TYPE.ACTION]: ({ dataTree, objectName }) => {
    return getActionChildrenPeekData(objectName, dataTree)?.peekData;
  },
  [ENTITY_TYPE.APPSMITH]: ({ dataTree }) => {
    return getAppsmithPeekData(dataTree).peekData;
  },
  [ENTITY_TYPE.JSACTION]: ({ dataTree, dataTreeEntity, jsActions }) => {
    const entity = dataTreeEntity as ActionEntity;
    const jsAction = jsActions.find(
      (jsAction) => jsAction.config.id === entity.actionId,
    );

    return jsAction
      ? getJsActionPeekData(jsAction, dataTree)?.peekData
      : entity;
  },
  [ENTITY_TYPE.WIDGET]: ({
    configTree,
    dataTree,
    dataTreeEntity,
    objectName,
  }) => {
    const entity = dataTreeEntity as WidgetEntity;

    return getWidgetChildrenPeekData(
      objectName,
      entity.type,
      dataTree,
      configTree,
    )?.peekData;
  },
};
