import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPageList } from "selectors/editorSelectors";
import { getActions } from "selectors/entitiesSelector";
import { SEARCH_ITEM_TYPES } from "./utils";
import { get } from "lodash";
import { useFilteredDatasources } from "pages/Editor/Explorer/hooks";

const recentEntitiesSelector = (state: AppState) =>
  state.ui.globalSearch.recentEntities;

const useResentEntities = () => {
  const widgetsByPage = useSelector((state: AppState) => state.ui.pageWidgets);
  const recentEntities = useSelector(recentEntitiesSelector);
  const actions = useSelector(getActions);
  const datasourcesMap = useFilteredDatasources("");

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
      } else if (type === "datasource" && params?.pageId) {
        return get(datasourcesMap, `${params?.pageId}.${id}`);
      } else if (type === "action")
        return actions.find((action) => action?.config?.id === id);
      else if (type === "widget" && params?.pageId) {
        return {
          ...get(widgetsByPage, `${params?.pageId}.${id}`),
          pageId: params?.pageId,
        };
      }
    })
    .filter(Boolean);

  return populatedRecentEntities;
};

export default useResentEntities;
