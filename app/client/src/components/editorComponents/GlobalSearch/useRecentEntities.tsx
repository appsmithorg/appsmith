import { Datasource } from "entities/Datasource";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getPageList } from "selectors/editorSelectors";
import { getActions } from "selectors/entitiesSelector";
import { SEARCH_ITEM_TYPES } from "./utils";

const recentEntitiesSelector = (state: AppState) =>
  state.ui.globalSearch.recentEntities;

const useResentEntities = (searchableWidgets: any, datasourcesList: any) => {
  const recentEntities = useSelector(recentEntitiesSelector);
  const actions = useSelector(getActions);

  const pages = useSelector(getPageList) || [];

  // lookup by keys, handle edge cases
  const populatedRecentEntities = recentEntities
    .map((entity) => {
      const { type, id } = entity;
      if (type === "page")
        return {
          ...pages.find((page) => page.pageId === id),
          kind: SEARCH_ITEM_TYPES.page,
        };
      else if (type === "datasource")
        return datasourcesList.find(
          (datasource: Datasource) => datasource.id === id,
        );
      else if (type === "action")
        return actions.find((action) => action?.config?.id === id);
      else if (type === "widget")
        return searchableWidgets.find((widget: any) => widget.widgetId === id);
    })
    .filter(Boolean);

  return populatedRecentEntities;
};

export default useResentEntities;
