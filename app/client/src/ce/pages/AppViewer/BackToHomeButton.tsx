import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AppsIcon from "remixicon-react/AppsLineIcon";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getMenuItemBackgroundColorOnHover,
  getMenuItemTextColor,
} from "pages/AppViewer/utils";
import styled from "styled-components";
import { TooltipComponent } from "design-system-old";
import classNames from "classnames";
import {
  getAppMode,
  getCurrentApplication,
} from "@appsmith/selectors/applicationSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { StyledApplicationName } from "pages/AppViewer/Navigation/components/ApplicationName.styled";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getViewModePageList } from "selectors/editorSelectors";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "RouteBuilder";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

export const { cloudHosting } = getAppsmithConfigs();

type BackToHomeButtonProps = {
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  logoConfiguration: NavigationSetting["logoConfiguration"];
  forSidebar?: boolean;
};

const StyledAppIcon = styled(AppsIcon)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  borderRadius: string;
  forSidebar?: boolean;
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getMenuItemTextColor(primaryColor, navColorStyle, true)};
  border-radius: ${({ borderRadius }) => borderRadius};
  transition: all 0.3s ease-in-out;
  margin-top: ${({ forSidebar }) => (forSidebar ? " -3px" : "-2px")};
  width: 100%;
  max-width: 28px;
`;

export const StyledLink = styled(Link)<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  min-width: max-content;

  &:hover {
    svg {
      background-color: ${({ navColorStyle, primaryColor }) =>
        getMenuItemBackgroundColorOnHover(primaryColor, navColorStyle)};

      ${({ navColorStyle, primaryColor }) => {
        if (navColorStyle !== NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT) {
          return `color: ${getMenuItemTextColor(primaryColor, navColorStyle)};`;
        }
      }};
    }
  }
`;

const StyledImage = styled.img`
  max-width: 10rem;
  max-height: 1.5rem;
`;

function BackToHomeButton(props: BackToHomeButtonProps) {
  const { forSidebar, logoConfiguration, navColorStyle, primaryColor } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const navStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting?.navStyle ||
    NAVIGATION_SETTINGS.NAV_STYLE.STACKED;
  const isMobile = useIsMobileDevice();
  const pages = useSelector(getViewModePageList);
  const appMode = useSelector(getAppMode);
  const defaultPage = pages.find((page) => page.isDefault) || pages[0];
  const pageUrl = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    {
      pageId: defaultPage?.pageId,
    },
  );
  const currentUser: User | undefined = useSelector(getCurrentUser);

  return (
    <div
      className={classNames({
        "flex items-center gap-2 mr-4": true,
        "mb-2": forSidebar,
      })}
    >
      {currentUser?.username !== ANONYMOUS_USERNAME && (
        <TooltipComponent content="Back to apps" position="bottom-left">
          <StyledLink
            className="group t--back-to-home hover:no-underline flex items-center gap-2 "
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
            to="/applications"
          >
            <StyledAppIcon
              borderRadius={
                selectedTheme.properties.borderRadius.appBorderRadius
              }
              className="p-1 w-7 h-7"
              forSidebar={forSidebar}
              navColorStyle={navColorStyle}
              primaryColor={primaryColor}
            />

            {!currentApplicationDetails?.applicationDetail?.navigationSetting
              ?.logoAssetId?.length ||
            logoConfiguration ===
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY ||
            logoConfiguration ===
              NAVIGATION_SETTINGS.LOGO_CONFIGURATION
                .NO_LOGO_OR_APPLICATION_TITLE ? (
              <StyledApplicationName
                className="text-base whitespace-nowrap"
                isMobile={isMobile}
                navColorStyle={navColorStyle}
                navStyle={navStyle}
                primaryColor={primaryColor}
              >
                Apps
              </StyledApplicationName>
            ) : (
              ""
            )}
          </StyledLink>
        </TooltipComponent>
      )}

      {currentApplicationDetails?.applicationDetail?.navigationSetting
        ?.logoAssetId?.length &&
      (logoConfiguration ===
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE ||
        logoConfiguration ===
          NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY) ? (
        <StyledLink
          className={classNames({
            "group hover:no-underline": true,
            "pointer-events-none select-none": pages.length <= 1,
          })}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
          to={pageUrl}
        >
          <StyledImage
            alt="Your application's logo"
            src={`/api/v1/assets/${currentApplicationDetails.applicationDetail.navigationSetting.logoAssetId}`}
          />
        </StyledLink>
      ) : (
        ""
      )}
    </div>
  );
}

export default BackToHomeButton;
