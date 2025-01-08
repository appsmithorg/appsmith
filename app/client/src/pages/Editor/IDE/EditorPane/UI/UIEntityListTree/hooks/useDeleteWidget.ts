import { useDispatch, useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { useCallback } from "react";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { getParentWidget } from "selectors/widgetSelectors";
import WidgetFactory from "WidgetProvider/factory";

const WidgetTypes = WidgetFactory.widgetTypes;

export function useDeleteWidget(widgetId: string): () => void {
  const dispatch = useDispatch();
  const { parentId, tabId, tabName } = useSelector(getWidgetByID(widgetId));

  const parentWidget = useSelector((state) => getParentWidget(state, widgetId));

  return useCallback(() => {
    // If the widget is a tab we are updating the `tabs` of the property of the widget
    // This is similar to deleting a tab from the property pane
    if (
      tabName &&
      parentWidget &&
      parentWidget.type === WidgetTypes.TABS_WIDGET
    ) {
      const tabsObj = { ...parentWidget.tabsObj };
      const filteredTabs = Object.values(tabsObj);

      if (parentId && !!filteredTabs.length) {
        dispatch({
          type: ReduxActionTypes.WIDGET_DELETE_TAB_CHILD,
          payload: { ...tabsObj[tabId] },
        });
      }

      return;
    }

    dispatch({
      type: WidgetReduxActionTypes.WIDGET_DELETE,
      payload: {
        widgetId,
        parentId,
      },
    });
  }, [dispatch, parentWidget, parentId, tabId, tabName, widgetId]);
}
