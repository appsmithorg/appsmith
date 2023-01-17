import { useCallback } from "react";
import { WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { flashElementsById } from "utils/helpers";
import { useDispatch } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { navigateToCanvas } from "./utils";
import { getCurrentPageWidgets } from "selectors/entitiesSelector";
import store from "store";
import { NavigationMethod } from "utils/history";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();

  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
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
    selectWidget(SelectionRequestType.ONE, [widgetId], navigationMethod);
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
        selectWidget(SelectionRequestType.SHIFT_SELECT, [widgetId]);
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
