import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled, { ThemeProvider } from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AppsmithLogo from "assets/images/appsmith_logo.png";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import {
  ApplicationPayload,
  PageListPayload,
} from "constants/ReduxActionConstants";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getEditorURL } from "selectors/appViewSelectors";
import { getViewModePageList } from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import { getCurrentOrgId } from "selectors/organizationSelectors";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import { IconWrapper } from "components/ads/Icon";
import Button, { Size } from "components/ads/Button";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { Profile } from "pages/common/ProfileImage";
import PageTabsContainer from "./PageTabsContainer";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import getAppViewerHeaderCTA from "./getAppViewerHeaderCTA";

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

const HeaderSection = styled.div<{ justify: string }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: ${(props) => props.justify};
`;

const AppsmithLogoImg = styled.img`
  padding-left: ${(props) => props.theme.spaces[7]}px;
  max-width: 110px;
`;

const HeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${(props) => props.theme.spaces[7]}px;
  height: 100%;
`;

const PrimaryLogoLink = styled(Link)`
  display: flex;
  align-items: center;
`;

type AppViewerHeaderProps = {
  url?: string;
  currentApplicationDetails?: ApplicationPayload;
  pages: PageListPayload;
  currentOrgId: string;
  currentUser?: User;
  lightTheme: Theme;
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const { currentApplicationDetails, currentOrgId, currentUser, pages } = props;
  const userPermissions = currentApplicationDetails?.userPermissions ?? [];
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const canEdit = isPermitted(userPermissions, permissionRequired);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;

  const HtmlTitle = () => {
    if (!currentApplicationDetails?.name) return null;
    return (
      <Helmet>
        <title>{currentApplicationDetails?.name}</title>
      </Helmet>
    );
  };
  if (hideHeader) return <HtmlTitle />;

  const forkUrl = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}/fork`;
  const loginUrl = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}`;

  const CTA = getAppViewerHeaderCTA({
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
        <HeaderRow justify={"space-between"}>
          <HeaderSection justify={"flex-start"}>
            <PrimaryLogoLink to={APPLICATIONS_URL}>
              <AppsmithLogoImg src={AppsmithLogo} alt="Appsmith logo" />
            </PrimaryLogoLink>
          </HeaderSection>
          <HeaderSection justify={"center"} className="current-app-name">
            {currentApplicationDetails && (
              <Text type={TextType.H4}>{currentApplicationDetails.name}</Text>
            )}
          </HeaderSection>
          <HeaderSection justify={"flex-end"}>
            {currentApplicationDetails && (
              <>
                <FormDialogComponent
                  trigger={
                    <Button
                      text={"Share"}
                      icon={"share"}
                      size={Size.small}
                      className="t--application-share-btn header__application-share-btn"
                    />
                  }
                  Form={AppInviteUsersForm}
                  orgId={currentOrgId}
                  applicationId={currentApplicationDetails.id}
                  title={currentApplicationDetails.name}
                  canOutsideClickClose={true}
                />
                {CTA && (
                  <HeaderRightItemContainer>{CTA}</HeaderRightItemContainer>
                )}
              </>
            )}
            {currentUser && currentUser.username !== ANONYMOUS_USERNAME && (
              <HeaderRightItemContainer>
                <ProfileDropdown
                  name={currentUser.name}
                  userName={currentUser?.username || ""}
                  hideThemeSwitch
                  modifiers={{
                    offset: {
                      enabled: true,
                      offset: `0, ${pages.length > 1 ? 35 : 0}`,
                    },
                  }}
                />
              </HeaderRightItemContainer>
            )}
          </HeaderSection>
        </HeaderRow>
        <PageTabsContainer
          pages={pages}
          currentApplicationDetails={currentApplicationDetails}
        />
      </HeaderWrapper>
    </ThemeProvider>
  );
};

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getViewModePageList(state),
  url: getEditorURL(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentOrgId: getCurrentOrgId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(AppViewerHeader);
