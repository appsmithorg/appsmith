import { createSelector } from "reselect";
import { AppState } from "reducers";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetTypes } from "constants/WidgetConstants";
import { getExistingWidgetNames, getWidgetNamePrefix } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

const getCanvasWidgets = (state: AppState) => state.entities.canvasWidgets;
export const getModalDropdownList = createSelector(
  getCanvasWidgets,
  widgets => {
    const modalWidgets = Object.values(widgets).filter(
      (widget: FlattenedWidgetProps) =>
        widget.type === WidgetTypes.MODAL_WIDGET,
    );
    if (modalWidgets.length === 0) return undefined;

    return modalWidgets.map((widget: FlattenedWidgetProps) => ({
      id: widget.widgetId,
      label: widget.widgetName,
      value: `'${widget.widgetName}'`,
    }));
  },
);

const getModalNamePrefix = (state: AppState) =>
  getWidgetNamePrefix(state, WidgetTypes.MODAL_WIDGET);

export const getNextModalName = createSelector(
  getExistingWidgetNames,
  getModalNamePrefix,
  (names, prefix) => getNextEntityName(prefix, names),
);
