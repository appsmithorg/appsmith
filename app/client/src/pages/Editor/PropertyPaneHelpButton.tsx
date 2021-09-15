import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import WidgetFactory from "utils/WidgetFactory";
import { getSelectedWidget } from "sagas/selectors";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";

function PropertyPaneHelpButton() {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type || "";
  const dispatch = useDispatch();
  const displayName =
    WidgetFactory.widgetConfigMap.get(selectedWidgetType)?.name || "";

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
      <HelpIcon className="h-4 w-4 text-trueGray-500" />
    </button>
  );
}

export default PropertyPaneHelpButton;
