import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";
import { getWidget } from "sagas/selectors";
import { getAppMode } from "selectors/applicationSelectors";
import { useSelector } from "store";
import { updateWidgetMetaPropAndEval } from "actions/metaActions";
import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;

export const useCanvasMinHeightUpdateHook = (
  widgetId: string,
  minHeight = 0,
) => {
  const widget = useSelector((state: AppState) => getWidget(state, widgetId));
  const dispatch = useDispatch();
  const appMode = useSelector(getAppMode);
  const canUpdateWidgetMinHeight =
    appMode === APP_MODE.EDIT &&
    widgetId !== MAIN_CONTAINER_WIDGET_ID &&
    widget &&
    widget.type === WidgetTypes.CANVAS_WIDGET;
  useEffect(() => {
    if (canUpdateWidgetMinHeight && widget.minHeight !== minHeight) {
      dispatch(updateWidgetMetaPropAndEval(widgetId, "minHeight", minHeight));
    }
  }, [minHeight]);
};
