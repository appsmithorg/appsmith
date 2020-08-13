import React from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AppsmithLogo from "assets/images/appsmith_logo_white.png";
import Button from "components/editorComponents/Button";
import { EDIT_APP } from "constants/messages";
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
  getApplicationViewerPageURL,
} from "constants/routes";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getEditorURL } from "selectors/appViewSelectors";
import { getPageList } from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import InviteUsersFormv2 from "pages/organization/InviteUsersFromv2";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { HeaderIcons } from "icons/HeaderIcons";
import { Colors } from "constants/Colors";

const HeaderWrapper = styled(StyledHeader)<{ hasPages: boolean }>`
  background: ${Colors.BALTIC_SEA};
  height: ${props => (props.hasPages ? "90px" : "48px")};
  color: white;
  flex-direction: column;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
`;

const HeaderRow = styled.div<{ justify: string }>`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: ${props => props.justify};
`;

const HeaderSection = styled.div<{ justify: string }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: ${props => props.justify};
`;

const AppsmithLogoImg = styled.img`
  max-width: 110px;
`;

const BackToEditorButton = styled(Button)`
  max-width: 200px;
  height: 32px;
  margin: 5px 10px;
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
  width: 150px;
  margin-right: 1px;
  align-self: flex-end;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background-color: rgb(49, 48, 51);
  && span {
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.04em;
    color: #fff;
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
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const { currentApplicationDetails, pages, currentOrgId } = props;
  const userPermissions = currentApplicationDetails?.userPermissions ?? [];
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const canEdit = isPermitted(userPermissions, permissionRequired);
  const canShare = isPermitted(
    userPermissions,
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );

  return (
    <HeaderWrapper hasPages={pages.length > 1}>
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
              {canShare && (
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
                  Form={InviteUsersFormv2}
                  orgId={currentOrgId}
                  applicationId={currentApplicationDetails.id}
                  title={currentApplicationDetails.name}
                />
              )}
              {props.url && canEdit && (
                <BackToEditorButton
                  className="t--back-to-editor"
                  href={props.url}
                  intent="primary"
                  icon="arrow-left"
                  iconAlignment="left"
                  text={EDIT_APP}
                  filled
                />
              )}
            </>
          )}
        </HeaderSection>
      </HeaderRow>
      {pages.length > 1 && (
        <HeaderRow justify={"flex-start"}>
          {pages.map(page => (
            <PageTab
              key={page.pageId}
              to={getApplicationViewerPageURL(
                currentApplicationDetails?.id,
                page.pageId,
              )}
              activeClassName="is-active"
            >
              <span>{page.pageName}</span>
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
});

export default connect(mapStateToProps)(AppViewerHeader);
