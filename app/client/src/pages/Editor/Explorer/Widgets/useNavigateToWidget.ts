import { useCallback } from "react";
import type { WidgetType } from "constants/WidgetConstants";
import { useParams } from "react-router";
import type { ExplorerURLParams } from "ee/pages/Editor/Explorer/helpers";
import { useDispatch } from "react-redux";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getCurrentPageWidgets } from "ee/selectors/entitiesSelector";
import store from "store";
import type { NavigationMethod } from "utils/history";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";

export const useNavigateToWidget = () => {
  const params = useParams<ExplorerURLParams>();

  const dispatch = useDispatch();
  const { selectWidget } = useWidgetSelection();
  const multiSelectWidgets = (widgetId: string) => {
    selectWidget(SelectionRequestType.PushPop, [widgetId]);
  };

  const selectSingleWidget = (
    widgetId: string,
    widgetType: WidgetType,
    navigationMethod?: NavigationMethod,
  ) => {
    selectWidget(SelectionRequestType.One, [widgetId], navigationMethod);
  };

  const navigateToWidget = useCallback(
    (
      widgetId: string,
      widgetType: WidgetType,
      basePageId: string,
      navigationMethod: NavigationMethod,
      isWidgetSelected?: boolean,
      isMultiSelect?: boolean,
      isShiftSelect?: boolean,
      /** Don't use unsafeSelect unless absolutely necessary.
       * This will skip all checks
       * and navigate to the widget directly and may cause ux issues */
      unsafeSelect?: boolean,
    ) => {
      if (unsafeSelect) {
        selectWidget(
          SelectionRequestType.UnsafeSelect,
          [widgetId],
          navigationMethod,
          basePageId,
        );
        return;
      }
      const allWidgets = getCurrentPageWidgets(store.getState());
      // restrict multi-select across pages
      if (widgetId && (isMultiSelect || isShiftSelect) && !allWidgets[widgetId])
        return;

      if (isShiftSelect) {
        selectWidget(SelectionRequestType.ShiftSelect, [widgetId]);
      } else if (isMultiSelect) {
        multiSelectWidgets(widgetId);
      } else {
        selectSingleWidget(widgetId, widgetType, navigationMethod);
      }
    },
    [dispatch, params, selectWidget],
  );

  return { navigateToWidget };
};
