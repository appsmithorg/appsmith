import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import WidgetFactory from "utils/WidgetFactory";
import { ControlIcons } from "icons/ControlIcons";
import { getSelectedWidget } from "sagas/selectors";

const QuestionIcon = ControlIcons.QUESTION;

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
      <QuestionIcon className="w-4 h-4 text-trueGray-500" />
    </button>
  );
}

export default PropertyPaneHelpButton;
