import { getEntityPeekData } from "ee/utils/FilterInternalProperties/getEntityPeekData";
import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";

export const filterInternalProperties = (
  objectName: string,
  dataTreeEntity: DataTreeEntity,
  jsActions: JSCollectionDataState,
  dataTree: DataTree,
  configTree: ConfigTree,
) => {
  const peekDataGetterMethod = getEntityPeekData[dataTreeEntity.ENTITY_TYPE];

  if (!peekDataGetterMethod) return dataTreeEntity;

  return peekDataGetterMethod({
    configTree,
    dataTree,
    dataTreeEntity,
    jsActions,
    objectName,
  });
};
