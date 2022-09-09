import React, { useState, useEffect, useRef } from "react";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NavLink } from "react-router-dom";
import {
  getAppMode,
  showAppInviteUsersDialogSelector,
} from "selectors/applicationSelectors";
import { useSelector } from "react-redux";
import classNames from "classnames";
import PrimaryCTA from "./PrimaryCTA";
import Button from "./AppViewerButton";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import BrandingBadge from "./BrandingBadgeMobile";
import { getAppViewHeaderHeight } from "selectors/appViewSelectors";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "RouteBuilder";
import { trimQueryString } from "utils/helpers";
import { inviteModalLinks } from "@appsmith/constants/forms";
import {
  createMessage,
  INVITE_USERS_MESSAGE,
  INVITE_USERS_PLACEHOLDER,
} from "@appsmith/constants/messages";

type AppViewerHeaderProps = {
  isOpen?: boolean;
  application?: ApplicationPayload;
  pages: Page[];
  url?: string;
  setMenuOpen?: (shouldOpen: boolean) => void;
  headerRef?: React.RefObject<HTMLDivElement>;
};

export function PageMenu(props: AppViewerHeaderProps) {
  const { application, headerRef, isOpen, pages, setMenuOpen } = props;
  const menuRef = useRef<any>();
  const selectedTheme = useSelector(getSelectedAppTheme);
  const workspaceID = useSelector(getCurrentWorkspaceId);
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const [query, setQuery] = useState("");
  const { hideWatermark } = getAppsmithConfigs();

  // hide menu on click outside
  useOnClickOutside(
    [menuRef, headerRef as React.RefObject<HTMLDivElement>],
    () => {
      if (typeof setMenuOpen === "function") {
        setMenuOpen?.(false);
      }
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

  return (
    <>
      {/* BG OVERLAY */}
      <div
        className={classNames({
          "fixed h-full w-full bg-black/30 transform transition-all": true,
          "opacity-0 hidden": !isOpen,
          "opacity-100": isOpen,
        })}
        style={{
          height: `calc(100% - ${headerHeight})`,
        }}
      />
      {/* MAIN CONTAINER */}
      <div
        className={classNames({
          "fixed flex flex-col w-7/12 bg-white transform transition-all duration-400": true,
          "-left-full": !isOpen,
          "left-0": isOpen,
        })}
        ref={menuRef}
        style={{
          height: `calc(100% - ${headerHeight}px)`,
        }}
      >
        <div className="flex-grow py-3 overflow-y-auto">
          {appPages.map((page) => (
            <PageNavLink key={page.pageId} page={page} query={query} />
          ))}
        </div>
        <div className="p-3 space-y-3 border-t">
          {application && (
            <FormDialogComponent
              Form={AppInviteUsersForm}
              applicationId={application.id}
              canOutsideClickClose
              headerIcon={{
                name: "right-arrow",
                bgColor: "transparent",
              }}
              isOpen={showAppInviteUsersDialog}
              links={inviteModalLinks}
              message={createMessage(INVITE_USERS_MESSAGE)}
              placeholder={createMessage(INVITE_USERS_PLACEHOLDER)}
              title={application.name}
              trigger={
                <Button
                  borderRadius={
                    selectedTheme.properties.borderRadius.appBorderRadius
                  }
                  boxShadow="none"
                  buttonColor={selectedTheme.properties.colors.primaryColor}
                  buttonVariant="SECONDARY"
                  className="w-full h-8"
                  text="Share"
                />
              }
              workspaceId={workspaceID}
            />
          )}
          <PrimaryCTA className="t--back-to-editor--mobile" url={props.url} />
          {!hideWatermark && (
            <a
              className="flex hover:no-underline"
              href="https://appsmith.com"
              rel="noreferrer"
              target="_blank"
            >
              <BrandingBadge />
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function PageNavLink({ page, query }: { page: Page; query: string }) {
  const appMode = useSelector(getAppMode);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const pathname = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { pageId: page.pageId },
  );

  return (
    <NavLink
      activeClassName="border-r-3 font-semibold"
      activeStyle={{
        borderColor: selectedTheme.properties.colors.primaryColor,
      }}
      className="flex flex-col px-4 py-2 text-gray-700 no-underline border-transparent border-r-3 hover:no-underline focus:text-gray-700"
      key={page.pageId}
      to={{
        pathname: trimQueryString(pathname),
        search: query,
      }}
    >
      {page.pageName}
    </NavLink>
  );
}

export default PageMenu;
