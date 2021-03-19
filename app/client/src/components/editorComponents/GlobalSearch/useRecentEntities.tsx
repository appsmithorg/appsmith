import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPageList } from "selectors/editorSelectors";
import { getActions, getAllWidgetsMap } from "selectors/entitiesSelector";
import { SEARCH_ITEM_TYPES } from "./utils";
import { get } from "lodash";

const recentEntitiesSelector = (state: AppState) =>
  state.ui.globalSearch.recentEntities;

const useResentEntities = () => {
  const widgetsMap = useSelector(getAllWidgetsMap);
  let recentEntities = useSelector(recentEntitiesSelector);
  recentEntities = recentEntities.slice(1);
  const actions = useSelector(getActions);
  const reducerDatasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });

  const pages = useSelector(getPageList) || [];

  const populatedRecentEntities = recentEntities
    .map((entity) => {
      const { type, id, params } = entity;
      if (type === "page") {
        const result = pages.find((page) => page.pageId === id);
        if (result) {
          return {
            ...result,
            kind: SEARCH_ITEM_TYPES.page,
          };
        } else {
          return null;
        }
      } else if (type === "datasource") {
        const datasource = reducerDatasources.find(
          (reducerDatasource) => reducerDatasource.id === id,
        );
        return (
          datasource && {
            ...datasource,
            pageId: params?.pageId,
          }
        );
      } else if (type === "action")
        return actions.find((action) => action?.config?.id === id);
      else if (type === "widget") {
        return get(widgetsMap, id, null);
      }
    })
    .filter(Boolean);

  return populatedRecentEntities;
};

export default useResentEntities;
