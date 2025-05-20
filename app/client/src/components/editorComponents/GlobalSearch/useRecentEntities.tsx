import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getPageList } from "selectors/editorSelectors";
import {
  getActions,
  getAllWidgetsMap,
  getJSCollections,
} from "ee/selectors/entitiesSelector";
import { SEARCH_ITEM_TYPES } from "./utils";
import { get } from "lodash";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { FocusEntity } from "navigation/FocusEntity";
import type { DataTreeEntityObject } from "ee/entities/DataTree/types";
import { useMemo } from "react";

const recentEntitiesSelector = (state: DefaultRootState) =>
  state.ui.globalSearch.recentEntities || [];
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyArr: any = [];
const useResentEntities = (): Array<
  DataTreeEntityObject & {
    entityType: FocusEntity;
  }
> => {
  const widgetsMap = useSelector(getAllWidgetsMap);
  const recentEntities = useSelector(recentEntitiesSelector);
  const actions = useSelector(getActions);
  const jsActions = useSelector(getJSCollections);
  const reducerDatasources = useSelector((state: DefaultRootState) => {
    return state.entities.datasources.list;
  });

  const pages = useSelector(getPageList);
  const result = useMemo(
    () =>
      (recentEntities || emptyArr)
        .map((entity) => {
          const { id, pageId, type } = entity;

          if (type === FocusEntity.EDITOR) {
            if (!pages) return null;

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
          else if (type === FocusEntity.WIDGET) {
            return { ...get(widgetsMap, id, null), entityType: type };
          }
        })
        .filter(Boolean),
    [recentEntities, actions, jsActions, pages, reducerDatasources, widgetsMap],
  );

  return result;
};

export default useResentEntities;
