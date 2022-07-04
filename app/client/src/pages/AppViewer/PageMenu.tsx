import React, { useState, useEffect, useRef } from "react";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { NavLink } from "react-router-dom";
import { getPageURL } from "utils/AppsmithUtils";
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
import { getShowBrandingBadge } from "@appsmith/selectors/workspaceSelectors";

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
  const appMode = useSelector(getAppMode);
  const menuRef = useRef<any>();
  const selectedTheme = useSelector(getSelectedAppTheme);
  const workspaceID = useSelector(getCurrentWorkspaceId);
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const [query, setQuery] = useState("");
  const showBrandingBadge = useSelector(getShowBrandingBadge);

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
        style={{
          height: `calc(100% - ${headerHeight}px)`,
        }}
      >
        <div className="flex-grow py-3 overflow-y-auto" ref={menuRef}>
          {appPages.map((page) => (
            <NavLink
              activeClassName="border-r-3 font-semibold"
              activeStyle={{
                borderColor: selectedTheme.properties.colors.primaryColor,
              }}
              className="flex flex-col px-4 py-2 text-gray-700 no-underline border-transparent border-r-3 hover:no-underline focus:text-gray-700"
              key={page.pageId}
              to={{
                pathname: getPageURL(page, appMode, application),
                search: query,
              }}
            >
              {page.pageName}
            </NavLink>
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
          {showBrandingBadge && <BrandingBadge />}
        </div>
      </div>
    </>
  );
}

export default PageMenu;
