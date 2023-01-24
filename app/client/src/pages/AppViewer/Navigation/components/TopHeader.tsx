import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { useHref } from "pages/Editor/utils";
import React from "react";
import { useSelector } from "react-redux";
import { builderURL } from "RouteBuilder";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import {
  getCurrentPageDescription,
  getCurrentPageId,
} from "selectors/editorSelectors";
import styled from "styled-components";
import {
  getMenuContainerBackgroundColor,
  getMenuItemBackgroundColorWhenActive,
} from "../../utils";
import HtmlTitle from "../../AppViewerHtmlTitle";
import MobileNavToggle from "./MobileNavToggle";
import ApplicationName from "./ApplicationName";
import ShareButton from "./ShareButton";
import HeaderRightItemContainer from "./HeaderRightItemContainer";
import PrimaryCTA from "pages/AppViewer/PrimaryCTA";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import ProfileDropdown from "pages/common/ProfileDropdown";
import TopStacked from "../TopStacked";

const HeaderRow = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${({ navColorStyle, primaryColor }) =>
      getMenuItemBackgroundColorWhenActive(primaryColor, navColorStyle)};
`;

const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;

type TopHeaderProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser?: User;
  isMenuOpen: boolean;
  setMenuOpen: (isMenuOpen: boolean) => void;
};

const TopHeader = (props: TopHeaderProps) => {
  const {
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    isMenuOpen,
    pages,
    setMenuOpen,
  } = props;
  const selectedTheme = useSelector(getSelectedAppTheme);
  const navColorStyle =
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const description = useSelector(getCurrentPageDescription);
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });

  return (
    <StyledNav
      className="relative js-appviewer-header"
      data-testid={"t--appsmith-app-viewer-header"}
      navColorStyle={navColorStyle}
      primaryColor={primaryColor}
    >
      <HtmlTitle
        description={description}
        name={currentApplicationDetails?.name}
      />
      <HeaderRow
        className="relative h-12 px-3 py-3 md:px-6"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        <section className="flex items-center gap-3 z-1">
          <MobileNavToggle isMenuOpen={isMenuOpen} setMenuOpen={setMenuOpen} />
        </section>
        <div className="absolute top-0 bottom-0 flex items-center w-full mt-auto">
          <ApplicationName
            appName={currentApplicationDetails?.name || "Application Name"}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        </div>
        <section className="relative flex items-center ml-auto space-x-3 z-1">
          {currentApplicationDetails && (
            <div className="hidden space-x-1 md:flex">
              {/* Since the Backend doesn't have navigationSetting field by default
                  and we are creating the default values only when any nav settings via the
                  settings pane has changed, we need to hide the share button ONLY when the showShareApp
                  setting is explicitly set to false by the user via the settings pane. */}
              {currentApplicationDetails?.navigationSetting?.showShareApp !==
                false && (
                <ShareButton
                  currentApplicationDetails={currentApplicationDetails}
                  currentWorkspaceId={currentWorkspaceId}
                />
              )}

              <HeaderRightItemContainer>
                <PrimaryCTA
                  className="t--back-to-editor"
                  navColorStyle={navColorStyle}
                  primaryColor={primaryColor}
                  url={editorURL}
                />
              </HeaderRightItemContainer>
            </div>
          )}
          {currentUser && currentUser.username !== ANONYMOUS_USERNAME && (
            <HeaderRightItemContainer>
              <ProfileDropdown
                modifiers={{
                  offset: {
                    enabled: true,
                    offset: `0, 0`,
                  },
                }}
                name={currentUser.name}
                photoId={currentUser?.photoId}
                userName={currentUser?.username || ""}
              />
            </HeaderRightItemContainer>
          )}
        </section>
      </HeaderRow>

      <TopStacked
        currentApplicationDetails={currentApplicationDetails}
        pages={pages}
      />
    </StyledNav>
  );
};

export default TopHeader;
