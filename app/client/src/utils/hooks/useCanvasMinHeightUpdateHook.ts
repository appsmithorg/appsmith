import { updateWidget } from "actions/pageActions";
import { WidgetTypes } from "constants/WidgetConstants";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import { useSelector } from "store";
import { WidgetOperations } from "widgets/BaseWidget";

export const useCanvasMinHeightUpdateHook = (
  widgetId: string,
  minHeight = 0,
) => {
  const widget = useSelector((state: AppState) => getWidget(state, widgetId));
  const dispatch = useDispatch();
  useEffect(() => {
    if (
      widget &&
      widget.type === WidgetTypes.CANVAS_WIDGET &&
      widget.minHeight !== minHeight
    ) {
      dispatch(
        updateWidget(WidgetOperations.UPDATE_PROPERTY, widgetId, {
          propertyPath: "minHeight",
          propertyValue: minHeight,
        }),
      );
    }
  }, [minHeight]);
};
