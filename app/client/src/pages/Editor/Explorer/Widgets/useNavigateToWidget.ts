import { useCallback } from "react";
import { WidgetTypes, WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../helpers";
import { flashElementById } from "utils/helpers";
import { useDispatch } from "react-redux";
import {
  forceOpenPropertyPane,
  showModal,
  closeAllModals,
} from "actions/widgetActions";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { navigateToCanvas } from "./utils";

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();
  const dispatch = useDispatch();
  const { selectWidget, shiftSelectWidget } = useWidgetSelection();
  const multiSelectWidgets = (widgetId: string, pageId: string) => {
    navigateToCanvas(params, window.location.pathname, pageId, widgetId);
    flashElementById(widgetId);
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
    navigateToCanvas(params, window.location.pathname, pageId, widgetId);
    flashElementById(widgetId);
    selectWidget(widgetId, false);
    dispatch(forceOpenPropertyPane(widgetId));
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
      if (isShiftSelect) {
        shiftSelectWidget(widgetId, widgetsInStep || []);
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
