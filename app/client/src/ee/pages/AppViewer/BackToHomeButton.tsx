export * from "ce/pages/AppViewer/BackToHomeButton";

import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AppsIcon from "remixicon-react/AppsLineIcon";

import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import styled from "styled-components";
import { TooltipComponent } from "design-system-old";
import classNames from "classnames";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

type BackToHomeButtonProps = {
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
  isLogoVisible?: boolean;
  setIsLogoVisible?: (isLogoVisible: boolean) => void;
};

export const StyledLink = styled(Link)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  forSidebar?: boolean;
}>`
  min-width: max-content;

  img {
    width: 100%;
    max-width: 6rem;
    max-height: 1.5rem;
  }

  &:hover {
    svg {
      background-color: ${({ navColorStyle, primaryColor }) =>
        getMenuItemBackgroundColorOnHover(
          primaryColor,
          navColorStyle,
        )} !important;

      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `color: ${getMenuItemTextColor(
            primaryColor,
            navColorStyle,
          )} !important;`;
        }
      }};
    }
  }
`;

function BackToHomeButton({
  forSidebar,
  isLogoVisible,
  navColorStyle,
  primaryColor,
  setIsLogoVisible,
}: BackToHomeButtonProps) {
  const tenantConfig = useSelector(getTenantConfig);
  const selectedTheme = useSelector(getSelectedAppTheme);

  useEffect(() => {
    if (setIsLogoVisible) {
      setIsLogoVisible(true);
    }
  }, []);

  return (
    <TooltipComponent content="Back to apps" position="bottom-left">
      <StyledLink
        className={classNames({
          "flex items-center gap-2 group t--back-to-home hover:no-underline":
            true,
          "mr-2": !isLogoVisible,
          "mb-2 mr-3": isLogoVisible,
        })}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
        to="/applications"
      >
        <AppsIcon
          className="p-1 w-7 h-7"
          style={{
            borderRadius: selectedTheme.properties.borderRadius.appBorderRadius,
            color: getMenuItemTextColor(primaryColor, navColorStyle, true),
            transition: "all 0.3s ease-in-out",
            marginTop: forSidebar ? " -3px" : "-2px",
            width: "100%",
          }}
        />
        {tenantConfig.brandLogoUrl && (
          <img alt="Logo" src={getAssetUrl(tenantConfig.brandLogoUrl)} />
        )}
      </StyledLink>
    </TooltipComponent>
  );
}

export default BackToHomeButton;
