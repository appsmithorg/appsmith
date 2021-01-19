import React, { useRef, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AppsmithLogo from "assets/images/appsmith_logo_white.png";
import Button from "components/editorComponents/Button";
import { EDIT_APP, FORK_APP, SIGN_IN } from "constants/messages";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "pages/Applications/permissionHelpers";
import {
  ApplicationPayload,
  PageListPayload,
} from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  getApplicationViewerPageURL,
  SIGN_UP_URL,
} from "constants/routes";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getEditorURL } from "selectors/appViewSelectors";
import { getPageList } from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { HeaderIcons } from "icons/HeaderIcons";
import { Colors } from "constants/Colors";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { isEllipsisActive } from "utils/helpers";
import TooltipComponent from "components/ads/Tooltip";

const HeaderWrapper = styled(StyledHeader)<{ hasPages: boolean }>`
  background: ${Colors.BALTIC_SEA};
  height: ${(props) => (props.hasPages ? "90px" : "48px")};
  color: white;
  flex-direction: column;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
`;

const HeaderRow = styled.div<{ justify: string }>`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: ${(props) => props.justify};
`;

const HeaderSection = styled.div<{ justify: string }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: ${(props) => props.justify};
`;

const AppsmithLogoImg = styled.img`
  max-width: 110px;
`;

const BackToEditorButton = styled(Button)`
  max-width: 200px;
  height: 32px;
  margin: 5px 10px;
`;

const ForkButton = styled(Button)`
  max-width: 200px;
  height: 32px;
  margin: 5px 10px;
  svg {
    transform: rotate(-90deg);
  }
`;

const ShareButton = styled(Button)`
  height: 32px;
  margin: 5px 10px;
  color: white !important;
`;

const StyledApplicationName = styled.span`
  font-size: 15px;
  font-weight: 500;
  font-size: 18px;
  line-height: 14px;
`;

const PageTab = styled(NavLink)`
  display: flex;
  height: 30px;
  max-width: 170px;
  margin-right: 1px;
  align-self: flex-end;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background-color: rgb(49, 48, 51);
  padding: 0px 10px;
  && span {
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.04em;
    color: #fff;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &&&:hover {
    text-decoration: none;
    background-color: #fff;
    span {
      color: #2e3d49;
    }
  }
  &&&.is-active {
    background-color: white;
    span {
      color: #2e3d49;
    }
  }
`;

type AppViewerHeaderProps = {
  url?: string;
  currentApplicationDetails?: ApplicationPayload;
  pages: PageListPayload;
  currentOrgId: string;
  currentUser?: User;
};

const PageTabName: React.FunctionComponent<{ name: string }> = ({ name }) => {
  const tabNameRef = useRef<HTMLSpanElement>(null);
  const [ellipsisActive, setEllipsisActive] = useState(false);
  const tabNameText = <span ref={tabNameRef}>{name}</span>;

  useEffect(() => {
    if (isEllipsisActive(tabNameRef?.current)) {
      setEllipsisActive(true);
    }
  }, [tabNameRef]);

  return ellipsisActive ? (
    <TooltipComponent maxWidth={400} content={name}>
      {tabNameText}
    </TooltipComponent>
  ) : (
    <>{tabNameText}</>
  );
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const { currentApplicationDetails, pages, currentOrgId, currentUser } = props;
  const isExampleApp = currentApplicationDetails?.appIsExample;
  const userPermissions = currentApplicationDetails?.userPermissions ?? [];
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const canEdit = isPermitted(userPermissions, permissionRequired);
  const queryParams = new URLSearchParams(useLocation().search);
  const hideHeader = !!queryParams.get("embed");
  const HtmlTitle = () => {
    if (!currentApplicationDetails?.name) return null;
    return (
      <Helmet>
        <title>{currentApplicationDetails?.name}</title>
      </Helmet>
    );
  };
  if (hideHeader) return <HtmlTitle />;
  // Mark default page as first page
  const appPages = pages;
  if (appPages.length > 1) {
    appPages.forEach(function(item, i) {
      if (item.isDefault) {
        appPages.splice(i, 1);
        appPages.unshift(item);
      }
    });
  }

  const forkAppUrl = `${window.location.origin}${SIGN_UP_URL}?appId=${currentApplicationDetails?.id}`;
  const loginAppUrl = `${window.location.origin}${AUTH_LOGIN_URL}?appId=${currentApplicationDetails?.id}`;

  let CTA = null;

  if (props.url && canEdit) {
    CTA = (
      <BackToEditorButton
        className="t--back-to-editor"
        href={props.url}
        intent="primary"
        icon="arrow-left"
        iconAlignment="left"
        text={EDIT_APP}
        filled
      />
    );
  } else if (isExampleApp) {
    CTA = (
      <ForkButton
        className="t--fork-app"
        href={forkAppUrl}
        intent="primary"
        icon="fork"
        iconAlignment="left"
        text={FORK_APP}
        filled
      />
    );
  } else if (
    currentApplicationDetails?.isPublic &&
    currentUser?.username === ANONYMOUS_USERNAME
  ) {
    CTA = (
      <ForkButton
        className="t--fork-app"
        href={loginAppUrl}
        intent="primary"
        text={SIGN_IN}
        filled
      />
    );
  }

  return (
    <HeaderWrapper hasPages={pages.length > 1}>
      <HtmlTitle />
      <HeaderRow justify={"space-between"}>
        <HeaderSection justify={"flex-start"}>
          <Link to={APPLICATIONS_URL}>
            <AppsmithLogoImg src={AppsmithLogo} alt="Appsmith logo" />
          </Link>
        </HeaderSection>
        <HeaderSection justify={"center"}>
          {currentApplicationDetails && (
            <StyledApplicationName>
              {currentApplicationDetails.name}
            </StyledApplicationName>
          )}
        </HeaderSection>
        <HeaderSection justify={"flex-end"}>
          {currentApplicationDetails && (
            <>
              <FormDialogComponent
                trigger={
                  <ShareButton
                    text="Share"
                    intent="none"
                    outline
                    size="small"
                    className="t--application-share-btn"
                    icon={
                      <HeaderIcons.SHARE
                        color={Colors.WHITE}
                        width={13}
                        height={13}
                      />
                    }
                  />
                }
                Form={AppInviteUsersForm}
                orgId={currentOrgId}
                applicationId={currentApplicationDetails.id}
                title={currentApplicationDetails.name}
                canOutsideClickClose={true}
              />
              {CTA}
            </>
          )}
        </HeaderSection>
      </HeaderRow>
      {appPages.length > 1 && (
        <HeaderRow justify={"flex-start"}>
          {appPages.map((page) => (
            <PageTab
              key={page.pageId}
              to={getApplicationViewerPageURL(
                currentApplicationDetails?.id,
                page.pageId,
              )}
              activeClassName="is-active"
              className="t--page-switch-tab"
            >
              <PageTabName name={page.pageName} />
            </PageTab>
          ))}
        </HeaderRow>
      )}
    </HeaderWrapper>
  );
};

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getPageList(state),
  url: getEditorURL(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentOrgId: getCurrentOrgId(state),
  currentUser: getCurrentUser(state),
});

export default connect(mapStateToProps)(AppViewerHeader);
