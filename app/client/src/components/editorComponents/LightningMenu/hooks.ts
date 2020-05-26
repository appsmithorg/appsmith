import { useSelector, useDispatch } from "react-redux";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";
import { RestAction } from "api/ActionAPI";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";

export const useWidgets = () => {
  return useSelector((state: AppState) => {
    const canvasWidgets = state.entities.canvasWidgets;
    const final = Object.values(canvasWidgets).filter(
      (widget: WidgetProps) =>
        !widget.children || widget.children?.length === 0 || !widget.widgetName,
    );
    return final;
  });
};

export const useActions = () => {
  const actions = useSelector((state: AppState) => {
    const currentPageId = state.entities.pageList.currentPageId;
    return state.entities.actions.filter(
      action => action.config.pageId === currentPageId,
    );
  });
  const apis: RestAction[] = actions
    .filter(action => action.config.pluginType === "API")
    .map(action => action.config);

  const queries: RestAction[] = actions
    .filter(action => action.config.pluginType === "DB")
    .map(action => action.config);

  return { apis, queries };
};

export const usePageId = () => {
  const pageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });
  return pageId || "";
};

export const useApplicationId = () => {
  const applicationId = useSelector((state: AppState) => {
    return state.entities.pageList.applicationId;
  });
  return applicationId || "";
};

export const useAllActions = () => {
  const actions = useSelector((state: AppState) => {
    const currentPageId = state.entities.pageList.currentPageId;
    return state.entities.actions.filter(
      action => action.config.pageId === currentPageId,
    );
  });
  return actions;
};

export const useDataSources = () => {
  const datasources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  return datasources;
};

export const usePluginIdsOfPackageNames = () => {
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list.filter(plugin =>
      PLUGIN_PACKAGE_DBS.includes(plugin.packageName),
    );
  });
  const pluginIds = plugins.map(plugin => plugin.id);
  return pluginIds;
};
