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
import { AppState } from "reducers";

type Props = {
  theme: Theme;
};

const PropertyPaneHelpButton = withTheme(({ theme }: Props) => {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type;
  const dispatch = useDispatch();
  const displayName = useSelector((state: AppState) => {
    return selectedWidgetType
      ? state.entities.widgetConfig.config[selectedWidgetType].displayName
      : "";
  });

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery(displayName));
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
