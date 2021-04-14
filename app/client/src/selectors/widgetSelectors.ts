import { createSelector } from "reselect";
import { AppState } from "reducers";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getExistingWidgetNames, getWidgetNamePrefix } from "sagas/selectors";
import { getNextEntityName } from "utils/AppsmithUtils";

import WidgetFactory from "utils/WidgetFactory";
const WidgetTypes = WidgetFactory.widgetTypes;

const getCanvasWidgets = (state: AppState) => state.entities.canvasWidgets;
export const getModalDropdownList = createSelector(
  getCanvasWidgets,
  (widgets) => {
    const modalWidgets = Object.values(widgets).filter(
      (widget: FlattenedWidgetProps) =>
        widget.type === WidgetTypes.MODAL_WIDGET,
    );
    if (modalWidgets.length === 0) return undefined;

    return modalWidgets.map((widget: FlattenedWidgetProps) => ({
      id: widget.widgetId,
      label: widget.widgetName,
      value: `${widget.widgetName}`,
    }));
  },
);

const getModalNamePrefix = (state: AppState) =>
  getWidgetNamePrefix(state, "TEXT_WIDGET"); //TODO (abhinav): Change this back when all widgets are migrated

export const getNextModalName = createSelector(
  getExistingWidgetNames,
  getModalNamePrefix,
  (names, prefix) => getNextEntityName(prefix, names),
);
