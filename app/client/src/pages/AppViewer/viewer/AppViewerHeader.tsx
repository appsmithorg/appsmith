import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled, { ThemeProvider } from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
// import AppsmithLogo from "assets/images/appsmith_logo.png";
import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith_logo_primary.svg";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import {
  CurrentApplicationData,
  PageListPayload,
} from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import { connect, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getEditorURL } from "selectors/appViewSelectors";
import {
  getCurrentApplicationId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import { getCurrentOrgId } from "selectors/organizationSelectors";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import Text, { TextType } from "components/ads/Text";
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
import GetAppViewerHeaderCTA from "./GetAppViewerHeaderCTA";
import { showAppInviteUsersDialogSelector } from "selectors/applicationSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ShareButtonComponent } from "../../Editor/EditorHeader";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";

const HeaderWrapper = styled(StyledHeader)<{ hasPages: boolean }>`
  box-shadow: unset;
  height: unset;
  padding: 0;
  background-color: ${(props) => props.theme.colors.header.background};
  color: white;
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
    width: 24px;
    height: 24px;

    span {
      font-size: 12px;
    }
  }

  & .current-app-name {
    overflow: auto;
  }
`;

const HeaderRow = styled.div<{ justify: string }>`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: ${(props) => props.justify};
  height: ${(props) => `calc(${props.theme.smallHeaderHeight})`};
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
`;

const AppsmithLogoImg = styled(AppsmithLogo)`
  max-width: 110px;
  width: 110px;
`;

const HeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const PrimaryLogoLink = styled(Link)`
  display: flex;
  align-items: center;
`;

type AppViewerHeaderProps = {
  url?: string;
  currentApplicationDetails?: CurrentApplicationData;
  pages: PageListPayload;
  currentOrgId: string;
  currentUser?: User;
  lightTheme: Theme;
};

export function AppViewerHeader(props: AppViewerHeaderProps) {
  const { currentApplicationDetails, currentOrgId, currentUser, pages } = props;
  const userPermissions = currentApplicationDetails?.userPermissions ?? [];
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const canEdit = isPermitted(userPermissions, permissionRequired);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const shouldHideComments = useHideComments();
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );

  function HtmlTitle() {
    if (!currentApplicationDetails?.name) return null;
    return (
      <Helmet>
        <title>{currentApplicationDetails?.name}</title>
      </Helmet>
    );
  }
  if (hideHeader) return <HtmlTitle />;

  const forkUrl = `${AUTH_LOGIN_URL}?redirectUrl=${
    window.location.origin
  }${getApplicationViewerPageURL({
    applicationId,
    pageId,
    suffix: "fork",
  })}`;
  const loginUrl = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}`;

  const CTA = GetAppViewerHeaderCTA({
    url: props.url,
    canEdit,
    currentApplicationDetails,
    currentUser,
    forkUrl,
    loginUrl,
  });

  return (
    <ThemeProvider theme={props.lightTheme}>
      <HeaderWrapper hasPages={pages.length > 1}>
        <HtmlTitle />
        <HeaderRow className="px-3" justify={"space-between"}>
          <HeaderSection className="space-x-3 justify-start">
            <div>
              <PrimaryLogoLink to={APPLICATIONS_URL}>
                <AppsmithLogoImg />
              </PrimaryLogoLink>
            </div>
            {!shouldHideComments && (
              <div>
                <ToggleCommentModeButton />
              </div>
            )}
          </HeaderSection>
          <HeaderSection className="current-app-name justify-center">
            {currentApplicationDetails && (
              <Text type={TextType.H4}>{currentApplicationDetails.name}</Text>
            )}
          </HeaderSection>
          <HeaderSection className="justify-end space-x-3">
            {currentApplicationDetails && (
              <>
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
                  trigger={<ShareButtonComponent />}
                />
                {CTA && (
                  <HeaderRightItemContainer>{CTA}</HeaderRightItemContainer>
                )}
              </>
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
        <TourCompletionMessage />
      </HeaderWrapper>
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
