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
import { TooltipComponent } from "design-system-old";
// import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";

type BackToHomeButtonProps = {
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
};

// const StyledLabel = styled.span<BackToHomeButtonProps>`
//   color: ${({ navColorStyle, primaryColor }) =>
//     getMenuItemTextColor(primaryColor, navColorStyle)};
//   font-size: ${({ forSidebar }) =>
//     forSidebar ? THEMEING_TEXT_SIZES.sm : THEMEING_TEXT_SIZES.base};
// `;

const StyledAppIcon = styled(AppsIcon)<
  BackToHomeButtonProps & {
    borderRadius: string;
  }
>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  border-radius: ${({ borderRadius }) => borderRadius};
  transition: all 0.3s ease-in-out;
  margin-top: ${({ forSidebar }) => (forSidebar ? " -3px" : "-2px")};
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
  const { forSidebar, navColorStyle, primaryColor } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <TooltipComponent content="Back to apps" position="bottom-left">
      <StyledLink
        className="flex items-center gap-2 group t--back-to-home hover:no-underline mr-3"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
        to="/applications"
      >
        <StyledAppIcon
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="p-1 w-7 h-7"
          forSidebar={forSidebar}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
        />
        {/* <StyledLabel
        className="hidden md:block"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        Apps
      </StyledLabel> */}
      </StyledLink>
    </TooltipComponent>
  );
}

export default BackToHomeButton;
