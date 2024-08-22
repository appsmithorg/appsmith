import { useEffect } from "react";

import WidgetFactory from "WidgetProvider/factory";
import { updateWidgetMetaPropAndEval } from "actions/metaActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { AppState } from "ee/reducers";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";

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
