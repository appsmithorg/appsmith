import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
// import AppsmithLogo from "assets/images/appsmith_logo.png";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { connect, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getEditorURL } from "selectors/appViewSelectors";
import { getViewModePageList } from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import { getCurrentOrgId } from "selectors/organizationSelectors";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { Classes } from "components/ads/common";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import { IconWrapper } from "components/ads/Icon";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { Profile } from "pages/common/ProfileImage";
import PageTabsContainer from "./PageTabsContainer";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import ToggleCommentModeButton, {
  useHideComments,
} from "pages/Editor/ToggleModeButton";
import { showAppInviteUsersDialogSelector } from "selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import HtmlTitle from "./AppViewerHtmlTitle";
import PrimaryCTA from "./PrimaryCTA";
import Button from "./AppViewerButton";
import { Colors } from "constants/Colors";
import MenuIcon from "remixicon-react/MenuFillIcon";
import CloseIcon from "remixicon-react/CloseFillIcon";
import PageMenu from "./PageMenu";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const HeaderWrapper = styled(StyledHeader)<{ hasPages: boolean }>`
  box-shadow: unset;
  height: unset;
  padding: 0;
  background-color: ${Colors.WHITE};
  flex-direction: column;
  .${Classes.TEXT} {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }

  & .header__application-share-btn {
    background-color: ${(props) => props.theme.colors.header.background};
    border-color: ${(props) => props.theme.colors.header.background};
    color: ${(props) => props.theme.colors.header.shareBtn};
    ${IconWrapper} path {
      fill: ${(props) => props.theme.colors.header.shareBtn};
    }
  }

  & .header__application-share-btn:hover {
    color: ${(props) => props.theme.colors.header.shareBtnHighlight};
    ${IconWrapper} path {
      fill: ${(props) => props.theme.colors.header.shareBtnHighlight};
    }
  }

  .header__application-fork-btn-wrapper {
    height: 100%;
  }

  .header__application-fork-btn-wrapper .ads-dialog-trigger {
    height: 100%;
  }

  & ${Profile} {
    width: 28px;
    height: 28px;

    span {
      font-size: 12px;
    }
  }

  & .current-app-name {
    overflow: auto;
  }
`;

const HeaderRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

type AppViewerHeaderProps = {
  url?: string;
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentOrgId: string;
  currentUser?: User;
  lightTheme: Theme;
};

export function AppViewerHeader(props: AppViewerHeaderProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const { currentApplicationDetails, currentOrgId, currentUser, pages } = props;
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;
  const shouldHideComments = useHideComments();
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={props.lightTheme}>
      <>
        <HeaderWrapper
          className="relative js-appviewer-header"
          data-testid={"t--appsmith-app-viewer-header"}
          hasPages={pages.length > 1}
          ref={headerRef}
        >
          <HtmlTitle name={currentApplicationDetails?.name} />
          <HeaderRow className="justify-between px-3 py-2 md:px-6">
            <HeaderSection className="justify-start flex-grow">
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
              <div className="w-full ml-2 text-center md:text-left md:ml-0">
                <div className="text-base font-medium text-gray-600">
                  {currentApplicationDetails?.name}
                </div>
              </div>
            </HeaderSection>
            <HeaderSection className="justify-end space-x-2">
              {currentApplicationDetails && (
                <div className="hidden space-x-2 md:flex">
                  {!shouldHideComments && <ToggleCommentModeButton />}
                  <FormDialogComponent
                    Form={AppInviteUsersForm}
                    applicationId={currentApplicationDetails.id}
                    canOutsideClickClose
                    headerIcon={{
                      name: "right-arrow",
                      bgColor: "transparent",
                    }}
                    isOpen={showAppInviteUsersDialog}
                    orgId={currentOrgId}
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
                  />

                  <HeaderRightItemContainer>
                    <PrimaryCTA className="t--back-to-editor" url={props.url} />
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
            </HeaderSection>
          </HeaderRow>
          <PageTabsContainer
            currentApplicationDetails={currentApplicationDetails}
            pages={pages}
          />
        </HeaderWrapper>
        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={props.url}
        />
        <TourCompletionMessage />
      </>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getViewModePageList(state),
  url: getEditorURL(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentOrgId: getCurrentOrgId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(AppViewerHeader);
