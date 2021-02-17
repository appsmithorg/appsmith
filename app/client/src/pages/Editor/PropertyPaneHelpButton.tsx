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

type Props = {
  theme: Theme;
};

const formatType = (type: string) => type.split("_")[0].toLowerCase();

const PropertyPaneHelpButton = withTheme(({ theme }: Props) => {
  const selectedWidget = useSelector(getSelectedWidget);
  const selectedWidgetType = selectedWidget?.type;
  const dispatch = useDispatch();

  const openHelpModal = useCallback(() => {
    dispatch(setGlobalSearchQuery(formatType(selectedWidgetType || "")));
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
