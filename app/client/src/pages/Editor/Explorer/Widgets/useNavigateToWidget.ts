import { useCallback } from "react";
import { WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { flashElementsById } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  forceOpenPropertyPane,
  showModal,
  closeAllModals,
} from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { navigateToCanvas } from "./utils";
import { getCurrentPageWidgets } from "selectors/entitiesSelector";
import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();
  const allWidgets = useSelector(getCurrentPageWidgets);
  const dispatch = useDispatch();
  const {
    selectWidget,
    shiftSelectWidgetEntityExplorer,
  } = useWidgetSelection();
  const multiSelectWidgets = (widgetId: string, pageId: string) => {
    navigateToCanvas(params, window.location.pathname, pageId, widgetId);
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
    navigateToCanvas(params, window.location.pathname, pageId, widgetId);

    // Navigating to a widget from query pane seems to make the property pane
    // appear below the entity explorer hence adding a timeout here
    setTimeout(() => {
      if (params.pageId === pageId) {
        flashElementsById(widgetId);
      }
      dispatch(forceOpenPropertyPane(widgetId));
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
    [dispatch, params, selectWidget, allWidgets],
  );

  return { navigateToWidget };
};
