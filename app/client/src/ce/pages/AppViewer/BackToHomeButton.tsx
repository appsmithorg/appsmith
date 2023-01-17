import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AppsIcon from "remixicon-react/AppsLineIcon";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { NavigationSetting } from "constants/AppConstants";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import styled from "styled-components";

type BackToHomeButtonProps = {
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
};

const StyledLabel = styled.span<BackToHomeButtonProps>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle)};
`;

const StyledAppIcon = styled(AppsIcon)<
  BackToHomeButtonProps & {
    borderRadius: string;
  }
>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle)};
  border-radius: ${({ borderRadius }) => borderRadius};
  transition: all 0.3s ease-in-out;
`;

const StyledLink = styled(Link)<BackToHomeButtonProps>`
  &:hover {
    ${StyledAppIcon} {
      background-color: ${({ navColorStyle, primaryColor }) =>
        getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};
    }
  }
`;

function BackToHomeButton(props: BackToHomeButtonProps) {
  const { navColorStyle, primaryColor } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <StyledLink
      className="flex items-center gap-2 group t--back-to-home hover:no-underline"
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
      to="/applications"
    >
      <StyledAppIcon
        borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
        className="p-1 w-7 h-7"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      />
      <StyledLabel
        className="hidden md:block"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        Apps
      </StyledLabel>
    </StyledLink>
  );
}

export default BackToHomeButton;
