import { ENTITY_TYPE } from "design-system-old";
import { getActionChildrenNavData } from "./ActionChildren";
import { getAppsmithNavData } from "./AppsmithNavData";
import { getWidgetChildrenNavData } from "./WidgetChildren";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import type { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { getJsChildrenNavData } from "./JsChildren";

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
      return getActionChildrenNavData(objectName, dataTree)?.peekData;
    case ENTITY_TYPE.APPSMITH:
      return getAppsmithNavData(data).peekData;
    case ENTITY_TYPE.JSACTION:
      const jsAction = jsActions.find(
        (jsAction) => jsAction.config.id === data.actionId,
      );
      return jsAction
        ? getJsChildrenNavData(jsAction, "temp", dataTree)?.peekData
        : data;
    case ENTITY_TYPE.WIDGET:
      return getWidgetChildrenNavData(objectName, data.type, dataTree, "temp")
        ?.peekData;
    default:
      return data;
  }
};
