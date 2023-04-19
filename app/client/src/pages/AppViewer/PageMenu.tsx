import React, { useState, useEffect, useRef } from "react";
import type {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { useSelector } from "react-redux";
import classNames from "classnames";
import PrimaryCTA from "./PrimaryCTA";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import BrandingBadge from "./BrandingBadgeMobile";
import { getAppViewHeaderHeight } from "selectors/appViewSelectors";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "RouteBuilder";
import { trimQueryString } from "utils/helpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { get } from "lodash";
import { PageMenuContainer, StyledNavLink } from "./PageMenu.styled";
import { StyledCtaContainer } from "./Navigation/Sidebar.styled";
import ShareButton from "./Navigation/components/ShareButton";

type NavigationProps = {
  isOpen?: boolean;
  application?: ApplicationPayload;
  pages: Page[];
  url?: string;
  setMenuOpen?: (shouldOpen: boolean) => void;
  headerRef?: React.RefObject<HTMLDivElement>;
};

export function PageMenu(props: NavigationProps) {
  const { application, headerRef, isOpen, pages, setMenuOpen } = props;
  const menuRef = useRef<any>();
  const selectedTheme = useSelector(getSelectedAppTheme);
  const workspaceID = useSelector(getCurrentWorkspaceId);
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const [query, setQuery] = useState("");
  const { hideWatermark } = getAppsmithConfigs();
  const navColorStyle =
    application?.applicationDetail?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  const closeMenu = () => {
    if (typeof setMenuOpen === "function") {
      setMenuOpen?.(false);
    }
  };

  // hide menu on click outside
  useOnClickOutside(
    [menuRef, headerRef as React.RefObject<HTMLDivElement>],
    () => {
      closeMenu();
    },
  );

  useEffect(() => {
    setQuery(window.location.search);
  }, [location.search]);

  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach((item, i) => {
      if (item.isDefault) {
        appPages.splice(i, 1);
        appPages.unshift(item);
      }
    });
  }

  // TODO: Rahul - Check how to use this function in the new layout.
  // const handleFormOpenOrClose = useCallback((isOpen: boolean) => {
  //   dispatch(setShowAppInviteUsersDialog(isOpen));
  // }, []);

  return (
    <>
      {/* BG OVERLAY */}
      <div
        className={classNames({
          "fixed h-full w-full bg-black/30 transform transition-all": true,
          "opacity-0 hidden": !isOpen,
          "opacity-100": isOpen,
        })}
        onClick={closeMenu}
        style={{
          height: `calc(100% - ${headerHeight})`,
        }}
      />
      {/* MAIN CONTAINER */}
      <PageMenuContainer
        className={classNames({
          "fixed flex flex-col w-7/12 transform transition-all duration-400":
            true,
          "-left-full": !isOpen,
          "left-0": isOpen,
        })}
        navColorStyle={navColorStyle}
        primaryColor={primaryColor}
        ref={menuRef}
        style={{
          height: `calc(100% - ${headerHeight}px)`,
        }}
      >
        <div className="flex-grow py-3 overflow-y-auto page-list-container">
          {appPages.map((page) => (
            <PageNavLink
              closeMenu={closeMenu}
              key={page.pageId}
              navColorStyle={navColorStyle}
              page={page}
              primaryColor={primaryColor}
              query={query}
            />
          ))}
        </div>
        <div className="py-3 border-t">
          {application && (
            <StyledCtaContainer>
              <ShareButton
                currentApplicationDetails={application}
                currentWorkspaceId={workspaceID}
                insideSidebar
              />

              {isOpen && (
                <PrimaryCTA
                  className="t--back-to-editor--mobile"
                  insideSidebar
                  navColorStyle={navColorStyle}
                  primaryColor={primaryColor}
                  url={props.url}
                />
              )}

              {!hideWatermark && (
                <a
                  className="flex hover:no-underline mt-2"
                  href="https://appsmith.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <BrandingBadge />
                </a>
              )}
            </StyledCtaContainer>
          )}
        </div>
      </PageMenuContainer>
    </>
  );
}

function PageNavLink({
  closeMenu,
  navColorStyle,
  page,
  primaryColor,
  query,
}: {
  page: Page;
  query: string;
  closeMenu: () => void;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}) {
  const appMode = useSelector(getAppMode);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const pathname = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { pageId: page.pageId },
  );

  return (
    <StyledNavLink
      activeClassName="border-r-3 font-semibold"
      activeStyle={{
        borderColor: selectedTheme.properties.colors.primaryColor,
      }}
      className="flex flex-col px-4 py-2 no-underline border-transparent border-r-3 hover:no-underline"
      key={page.pageId}
      navColorStyle={navColorStyle}
      onClick={closeMenu}
      primaryColor={primaryColor}
      to={{
        pathname: trimQueryString(pathname),
        search: query,
      }}
    >
      {page.pageName}
    </StyledNavLink>
  );
}

export default PageMenu;
