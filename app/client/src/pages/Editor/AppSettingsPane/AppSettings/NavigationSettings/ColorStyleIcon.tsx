import React from "react";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
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
  border: 1px solid ${Colors.GREY_200};
`;

const ColorStyleIcon = (props: {
  colorStyle: NavigationSetting["colorStyle"];
}) => {
  const selectedTheme = useSelector(getSelectedAppTheme);
  let backgroundColor = Colors.WHITE;

  if (props.colorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.SOLID) {
    backgroundColor =
      selectedTheme?.properties?.colors?.primaryColor || Colors.WHITE;
  } else if (props.colorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.DARK) {
    backgroundColor = Colors.GREY_900;
  } else if (props.colorStyle === NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
    backgroundColor = Colors.WHITE;
  }

  return <StyledIcon backgroundColor={backgroundColor} />;
};

export default ColorStyleIcon;
