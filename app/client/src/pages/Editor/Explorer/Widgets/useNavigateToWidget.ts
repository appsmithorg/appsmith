import { useCallback } from "react";
import { WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { flashElementsById, quickScrollToWidget } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { navigateToCanvas } from "./utils";
import {
  getCanvasWidgets,
  getCurrentPageWidgets,
} from "selectors/entitiesSelector";
import { inGuidedTour } from "selectors/onboardingSelectors";
import store from "store";
import { NavigationMethod } from "utils/history";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();

  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
  const canvasWidgets = useSelector(getCanvasWidgets);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const multiSelectWidgets = (widgetId: string, pageId: string) => {
    navigateToCanvas(pageId);
    flashElementsById(widgetId);
    selectWidget(SelectionRequestType.PushPop, [widgetId]);
  };

  const selectSingleWidget = (
    widgetId: string,
    widgetType: WidgetType,
    pageId: string,
    navigationMethod?: NavigationMethod,
  ) => {
    selectWidget(SelectionRequestType.One, [widgetId]);
    navigateToCanvas(pageId, widgetId, navigationMethod);
    quickScrollToWidget(widgetId, canvasWidgets);
    // Navigating to a widget from query pane seems to make the property pane
    // appear below the entity explorer hence adding a timeout here
    setTimeout(() => {
      // Scrolling will hide some part of the content at the top during guided tour. To avoid that
      // we skip scrolling altogether during guided tour as we don't have
      // too many widgets during the same
      if (params.pageId === pageId && !guidedTourEnabled) {
        flashElementsById(widgetId);
      }
    }, 0);
  };

  const navigateToWidget = useCallback(
    (
      widgetId: string,
      widgetType: WidgetType,
      pageId: string,
      navigationMethod: NavigationMethod,
      isWidgetSelected?: boolean,
      isMultiSelect?: boolean,
      isShiftSelect?: boolean,
    ) => {
      const allWidgets = getCurrentPageWidgets(store.getState());
      // restrict multi-select across pages
      if (widgetId && (isMultiSelect || isShiftSelect) && !allWidgets[widgetId])
        return;

      if (isShiftSelect) {
        selectWidget(SelectionRequestType.ShiftSelect, [widgetId]);
      } else if (isMultiSelect) {
        multiSelectWidgets(widgetId, pageId);
      } else {
        selectSingleWidget(widgetId, widgetType, pageId, navigationMethod);
      }
    },
    [dispatch, params, selectWidget],
  );

  return { navigateToWidget };
};
