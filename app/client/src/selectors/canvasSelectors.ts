import { AppState } from "@appsmith/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { Positioning } from "utils/autoLayout/constants";

export const getIsDraggingForSelection = (state: AppState) => {
  return state.ui.canvasSelection.isDraggingForSelection;
};

export const getIsAutoLayout = createSelector(
  getWidgets,
  (widgets: CanvasWidgetsReduxState): boolean => {
    const mainContainer = widgets[MAIN_CONTAINER_WIDGET_ID];

    return (
      mainContainer.useAutoLayout &&
      mainContainer.positioning === Positioning.Vertical
    );
  },
);
