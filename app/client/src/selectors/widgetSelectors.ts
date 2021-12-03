import { createSelector } from "reselect";
import { AppState } from "reducers";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getExistingWidgetNames } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

import WidgetFactory from "utils/WidgetFactory";

const getCanvasWidgets = (state: AppState) => state.entities.canvasWidgets;
export const getModalDropdownList = createSelector(
  getCanvasWidgets,
  (widgets) => {
    const modalWidgets = Object.values(widgets).filter(
      (widget: FlattenedWidgetProps) => widget.type === "MODAL_WIDGET",
    );
    if (modalWidgets.length === 0) return undefined;

    return modalWidgets.map((widget: FlattenedWidgetProps) => ({
      id: widget.widgetId,
      label: widget.widgetName,
      value: `${widget.widgetName}`,
    }));
  },
);

export const getNextModalName = createSelector(
  getExistingWidgetNames,
  (names) => {
    const prefix =
      WidgetFactory.widgetConfigMap.get("MODAL_WIDGET")?.widgetName || "";
    return getNextEntityName(prefix, names);
  },
);
