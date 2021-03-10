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
import { widgetSidebarConfig } from "mockResponses/WidgetSidebarResponse";

type Props = {
  theme: Theme;
};

const PropertyPaneHelpButton = withTheme(({ theme }: Props) => {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type;
  const dispatch = useDispatch();
  const config = selectedWidgetType && widgetSidebarConfig[selectedWidgetType];

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery(config?.widgetCardName || ""));
    dispatch(toggleShowGlobalSearchModal());
  }, [selectedWidgetType]);

  return (
    <Icon
      onClick={openHelpModal}
      color={theme.colors.paneSectionLabel}
      icon="help"
      iconSize={16}
    />
  );
});

export default PropertyPaneHelpButton;
