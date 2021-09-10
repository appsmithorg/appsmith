import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { withTheme } from "styled-components";
import { Icon } from "@blueprintjs/core";

import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { getSelectedWidget } from "sagas/selectors";
import { Theme } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import WidgetFactory from "utils/WidgetFactory";

type Props = {
  theme: Theme;
};

const PropertyPaneHelpButton = withTheme(({ theme }: Props) => {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type || "";
  const dispatch = useDispatch();
  const displayName =
    WidgetFactory.widgetConfigMap.get(selectedWidgetType)?.name || "";

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery(displayName));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "PROPERTY_PANE_HELP_BUTTON",
    });
  }, [selectedWidgetType]);

  return (
    <Icon
      color={theme.colors.paneSectionLabel}
      icon="help"
      iconSize={16}
      onClick={openHelpModal}
    />
  );
});

export default PropertyPaneHelpButton;
