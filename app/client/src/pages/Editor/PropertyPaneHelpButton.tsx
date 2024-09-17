import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import WidgetFactory from "WidgetProvider/factory";
import { getSelectedWidget } from "sagas/selectors";
import { Icon } from "@appsmith/ads";

function PropertyPaneHelpButton() {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type || "";
  const dispatch = useDispatch();
  const displayName =
    WidgetFactory.widgetConfigMap.get(selectedWidgetType)?.displayName || "";

  /**
   * on click open the omnibar and toggle global search
   */
  const onClick = useCallback(() => {
    dispatch(setGlobalSearchQuery(displayName));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "PROPERTY_PANE_HELP_BUTTON",
    });
  }, [selectedWidgetType]);

  return (
    <button className="p-1 hover:bg-warmGray-100 group" onClick={onClick}>
      <Icon className="w-4 h-4 text-trueGray-500" name="question" />
    </button>
  );
}

export default PropertyPaneHelpButton;
