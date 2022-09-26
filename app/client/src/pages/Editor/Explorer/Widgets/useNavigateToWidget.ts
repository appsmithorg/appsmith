import { useCallback } from "react";
import { WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { flashElementsById } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import { showModal, closeAllModals } from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { navigateToCanvas } from "./utils";
import { getCurrentPageWidgets } from "selectors/entitiesSelector";
import WidgetFactory from "utils/WidgetFactory";
import { inGuidedTour } from "selectors/onboardingSelectors";
import store from "store";

const WidgetTypes = WidgetFactory.widgetTypes;

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();

  const dispatch = useDispatch();
  const {
    selectWidget,
    shiftSelectWidgetEntityExplorer,
  } = useWidgetSelection();
  const guidedTourEnabled = useSelector(inGuidedTour);
  const multiSelectWidgets = (widgetId: string, pageId: string) => {
    navigateToCanvas({ pageId, widgetId });
    flashElementsById(widgetId);
    selectWidget(widgetId, true);
  };

  const selectSingleWidget = (
    widgetId: string,
    widgetType: WidgetType,
    pageId: string,
    parentModalId?: string,
  ) => {
    if (widgetType === WidgetTypes.MODAL_WIDGET) {
      dispatch(showModal(widgetId));
      return;
    }
    if (parentModalId) dispatch(showModal(parentModalId));
    else dispatch(closeAllModals());
    selectWidget(widgetId, false);
    navigateToCanvas({ pageId, widgetId });

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
      isWidgetSelected?: boolean,
      parentModalId?: string,
      isMultiSelect?: boolean,
      isShiftSelect?: boolean,
      widgetsInStep?: string[],
    ) => {
      const allWidgets = getCurrentPageWidgets(store.getState());
      // restrict multi-select across pages
      if (widgetId && (isMultiSelect || isShiftSelect) && !allWidgets[widgetId])
        return;

      if (isShiftSelect) {
        shiftSelectWidgetEntityExplorer(widgetId, widgetsInStep || []);
      } else if (isMultiSelect) {
        multiSelectWidgets(widgetId, pageId);
      } else {
        selectSingleWidget(widgetId, widgetType, pageId, parentModalId);
      }
    },
    [dispatch, params, selectWidget],
  );

  return { navigateToWidget };
};
