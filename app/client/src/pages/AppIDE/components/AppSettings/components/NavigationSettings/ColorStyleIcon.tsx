import React from "react";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import styled from "styled-components";

const StyledIcon = styled.div<{
  backgroundColor: string;
}>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  height: 14px;
  width: 14px;
  border-radius: 100%;
  margin-right: 4px;
  border: 1px solid var(--ads-v2-color-border);
`;

const ColorStyleIcon = (props: {
  colorStyle: NavigationSetting["colorStyle"];
}) => {
  const selectedTheme = useSelector(getSelectedAppTheme);
  let backgroundColor = Colors.WHITE;

  if (props.colorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.THEME) {
    backgroundColor =
      selectedTheme?.properties?.colors?.primaryColor || Colors.WHITE;
  } else if (props.colorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    backgroundColor = Colors.WHITE;
  }

  return <StyledIcon backgroundColor={backgroundColor} />;
};

export default ColorStyleIcon;
