import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ControlIcons } from "icons/ControlIcons";

import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { getSelectedWidget } from "sagas/selectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import WidgetFactory from "utils/WidgetFactory";

const QuestionIcon = ControlIcons.QUESTION;

function PropertyPaneHelpButton() {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type || "";
  const dispatch = useDispatch();
  const displayName =
    WidgetFactory.widgetConfigMap.get(selectedWidgetType)?.displayName || "";

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery(displayName));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "PROPERTY_PANE_HELP_BUTTON",
    });
  }, [selectedWidgetType]);

  return <QuestionIcon height={16} onClick={openHelpModal} width={16} />;
}

export default PropertyPaneHelpButton;
