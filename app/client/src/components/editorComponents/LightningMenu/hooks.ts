import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import type { WidgetProps } from "widgets/BaseWidget";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";

export const useWidgets = () => {
  return useSelector((state: AppState) => {
    const canvasWidgets = state.entities.canvasWidgets;
    const final = Object.values(canvasWidgets).filter(
      (widget: WidgetProps) =>
        !widget.children || widget.children?.length === 0,
    );

    return final;
  });
};

export const useActions = () => {
  const actions = useSelector((state: AppState) => {
    const currentPageId = state.entities.pageList.currentPageId;

    return state.entities.actions.filter(
      (action) => action.config.pageId === currentPageId,
    );
  });
  const apis: Action[] = actions
    .filter((action) => action.config.pluginType === PluginType.API)
    .map((action) => action.config);

  const queries: Action[] = actions
    .filter((action) => action.config.pluginType === PluginType.DB)
    .map((action) => action.config);

  const saas: Action[] = actions
    .filter(
      (action) =>
        action.config.pluginType === PluginType.SAAS ||
        action.config.pluginType === PluginType.REMOTE ||
        action.config.pluginType === PluginType.INTERNAL ||
        action.config.pluginType === PluginType.AI,
    )
    .map((action) => action.config);

  return { apis, queries, saas };
};

export const usePageId = () => {
  const pageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });

  return pageId || "";
};
