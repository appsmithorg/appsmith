import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
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
import HtmlTitle from "../../AppViewerHtmlTitle";
import MobileNavToggle from "./MobileNavToggle";
import ApplicationName from "./ApplicationName";
import ShareButton from "./ShareButton";
import HeaderRightItemContainer from "./HeaderRightItemContainer";
import PrimaryCTA from "pages/AppViewer/PrimaryCTA";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import ProfileDropdown from "pages/common/ProfileDropdown";
import TopStacked from "../TopStacked";
import { HeaderRow, StyledNav } from "./TopHeader.styled";
import TopInline from "../TopInline";

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
        className="relative h-12 px-3 md:px-6"
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
      >
        <section className="py-3">
          <MobileNavToggle isMenuOpen={isMenuOpen} setMenuOpen={setMenuOpen} />

          <ApplicationName
            appName={currentApplicationDetails?.name || "Application Name"}
            navColorStyle={navColorStyle}
            primaryColor={primaryColor}
          />
        </section>

        {currentApplicationDetails?.navigationSetting?.orientation ===
          NAVIGATION_SETTINGS.ORIENTATION.TOP &&
          currentApplicationDetails?.navigationSetting?.navStyle ===
            NAVIGATION_SETTINGS.NAV_STYLE.INLINE && (
            <TopInline
              currentApplicationDetails={currentApplicationDetails}
              pages={pages}
            />
          )}

        <section className="relative flex items-center space-x-3 z-1 ml-auto py-3">
          {currentApplicationDetails && (
            <div className="hidden space-x-1 md:flex">
              <ShareButton
                currentApplicationDetails={currentApplicationDetails}
                currentWorkspaceId={currentWorkspaceId}
              />

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

      {currentApplicationDetails?.navigationSetting?.orientation ===
        NAVIGATION_SETTINGS.ORIENTATION.TOP &&
        currentApplicationDetails?.navigationSetting?.navStyle ===
          NAVIGATION_SETTINGS.NAV_STYLE.STACKED && (
          <TopStacked
            currentApplicationDetails={currentApplicationDetails}
            pages={pages}
          />
        )}
    </StyledNav>
  );
};

export default TopHeader;
