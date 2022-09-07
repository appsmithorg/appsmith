import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
// import AppsmithLogo from "assets/images/appsmith_logo.png";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { connect, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getCurrentPageId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { Theme } from "constants/DefaultTheme";
import ProfileDropdown from "pages/common/ProfileDropdown";
import PageTabsContainer from "./PageTabsContainer";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { showAppInviteUsersDialogSelector } from "selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import HtmlTitle from "./AppViewerHtmlTitle";
import PrimaryCTA from "./PrimaryCTA";
import Button from "./AppViewerButton";
import MenuIcon from "remixicon-react/MenuFillIcon";
import CloseIcon from "remixicon-react/CloseFillIcon";
import PageMenu from "./PageMenu";
import BackToHomeButton from "./BackToHomeButton";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const HeaderRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const HeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

type AppViewerHeaderProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser?: User;
  lightTheme: Theme;
};

export function AppViewerHeader(props: AppViewerHeaderProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const {
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    pages,
  } = props;
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={props.lightTheme}>
      <>
        <nav
          className="relative js-appviewer-header bg-white"
          data-testid={"t--appsmith-app-viewer-header"}
          ref={headerRef}
        >
          <HtmlTitle name={currentApplicationDetails?.name} />
          <HeaderRow className="relative h-12 px-3 py-3 md:px-6">
            <section className="flex items-center gap-3 z-1">
              <div
                className="block w-5 h-5 cursor-pointer md:hidden"
                onClick={() => setMenuOpen((prevState) => !prevState)}
              >
                {isMenuOpen ? (
                  <CloseIcon className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </div>
              <div className="">
                {currentUser?.username !== ANONYMOUS_USERNAME && (
                  <BackToHomeButton />
                )}
              </div>
            </section>
            <div className="absolute top-0 bottom-0 flex items-center justify-center w-full mt-auto text-center">
              <div className="w-7/12 overflow-hidden text-base font-medium text-gray-600 overflow-ellipsis whitespace-nowrap">
                {currentApplicationDetails?.name}
              </div>
            </div>
            <section className="relative flex items-center ml-auto space-x-3 z-1">
              {currentApplicationDetails && (
                <div className="hidden md:flex space-x-3">
                  <FormDialogComponent
                    Form={AppInviteUsersForm}
                    applicationId={currentApplicationDetails.id}
                    canOutsideClickClose
                    headerIcon={{
                      name: "right-arrow",
                      bgColor: "transparent",
                    }}
                    isOpen={showAppInviteUsersDialog}
                    title={currentApplicationDetails.name}
                    trigger={
                      <Button
                        borderRadius={
                          selectedTheme.properties.borderRadius.appBorderRadius
                        }
                        boxShadow="none"
                        buttonColor={
                          selectedTheme.properties.colors.primaryColor
                        }
                        buttonVariant="SECONDARY"
                        className="h-8"
                        text="Share"
                      />
                    }
                    workspaceId={currentWorkspaceId}
                  />

                  <HeaderRightItemContainer>
                    <PrimaryCTA className="t--back-to-editor" url={editorURL} />
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
          <PageTabsContainer
            currentApplicationDetails={currentApplicationDetails}
            pages={pages}
          />
        </nav>
        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={editorURL}
        />
        <TourCompletionMessage />
      </>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getViewModePageList(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentWorkspaceId: getCurrentWorkspaceId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(AppViewerHeader);
