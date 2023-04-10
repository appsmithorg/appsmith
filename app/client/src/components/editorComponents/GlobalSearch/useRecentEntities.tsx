import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getPageList } from "selectors/editorSelectors";
import {
  getActions,
  getAllWidgetsMap,
  getJSCollections,
} from "selectors/entitiesSelector";
import { SEARCH_ITEM_TYPES } from "./utils";
import { get } from "lodash";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { FocusEntity } from "navigation/FocusEntity";
import type { DataTreeEntityObject } from "entities/DataTree/dataTreeFactory";

const recentEntitiesSelector = (state: AppState) =>
  state.ui.globalSearch.recentEntities || [];

const useResentEntities = (): Array<
  DataTreeEntityObject & {
    entityType: FocusEntity;
  }
> => {
  const widgetsMap = useSelector(getAllWidgetsMap);
  const recentEntities = useSelector(recentEntitiesSelector);
  const actions = useSelector(getActions);
  const jsActions = useSelector(getJSCollections);
  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });

  const pages = useSelector(getPageList) || [];

  return (recentEntities || [])
    .map((entity) => {
      const { id, pageId, type } = entity;
      if (type === FocusEntity.PAGE) {
        const result = pages.find((page) => page.pageId === id);
        if (result) {
          return {
            ...result,
            entityType: type,
            kind: SEARCH_ITEM_TYPES.page,
          };
        } else {
          return null;
        }
      } else if (type === FocusEntity.DATASOURCE) {
        const datasource = reducerDatasources.find(
          (reducerDatasource) => reducerDatasource.id === id,
        );
        return (
          datasource && {
            ...datasource,
            entityType: type,
            pageId,
          }
        );
      } else if (type === FocusEntity.API || type === FocusEntity.QUERY)
        return {
          ...actions.find((action) => action?.config?.id === id),
          entityType: type,
        };
      else if (type === FocusEntity.JS_OBJECT)
        return {
          ...jsActions.find(
            (action: JSCollectionData) => action?.config?.id === id,
          ),
          entityType: type,
        };
      else if (type === FocusEntity.PROPERTY_PANE) {
        return { ...get(widgetsMap, id, null), entityType: type };
      }
    })
    .filter(Boolean);
};

export default useResentEntities;
