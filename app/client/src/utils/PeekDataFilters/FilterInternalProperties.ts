import { ENTITY_TYPE } from "design-system-old";
import { getActionChildrenPeekData } from "./Action";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import type { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { getWidgetChildrenPeekData } from "./Widget";
import { getJsActionPeekData } from "./JsAction";
import { getAppsmithPeekData } from "./Appsmith";

export const filterInternalProperties = (
  objectName: string,
  data: any,
  jsActions: JSCollectionDataState,
  dataTree: DataTree,
) => {
  if (!data) return;
  const entityType: ENTITY_TYPE = data.ENTITY_TYPE;
  switch (entityType) {
    case ENTITY_TYPE.ACTION:
      return getActionChildrenPeekData(objectName, dataTree)?.peekData;
    case ENTITY_TYPE.APPSMITH:
      return getAppsmithPeekData(dataTree).peekData;
    case ENTITY_TYPE.JSACTION:
      const jsAction = jsActions.find(
        (jsAction) => jsAction.config.id === data.actionId,
      );
      return jsAction
        ? getJsActionPeekData(jsAction, dataTree)?.peekData
        : data;
    case ENTITY_TYPE.WIDGET:
      return getWidgetChildrenPeekData(objectName, data.type, dataTree)
        ?.peekData;
    default:
      return data;
  }
};
