import { mergeWith } from "lodash";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { WidgetProps } from "widgets/BaseWidget";
import { RestAction } from "api/ActionAPI";

export const useWidgets = () => {
  return useSelector((state: AppState) => {
    const canvasWidgets = state.entities.canvasWidgets;
    const metaProps = state.entities.meta;
    const widgets = mergeWith(canvasWidgets, metaProps, (obj, src) => {
      return Object.assign({}, obj, src);
    });
    const final = Object.values(widgets).filter(
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
