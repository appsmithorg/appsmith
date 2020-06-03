import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";
import { RestAction } from "api/ActionAPI";

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
