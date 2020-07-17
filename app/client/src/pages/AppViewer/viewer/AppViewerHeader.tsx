import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { withRouter, RouteComponentProps } from "react-router";
import { fetchApplication } from "actions/applicationActions";
import { FormIcons } from "icons/FormIcons";
import Button from "components/editorComponents/Button";
import { BACK_TO_EDITOR } from "constants/messages";
import { isPermitted } from "pages/Applications/permissionHelpers";
import { ApplicationPayload } from "constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";

const HeaderWrapper = styled(StyledHeader)`
  position: fixed;
  top: 0;
  left: 0;
  background: white;
  justify-content: space-between;
`;

const StyledHomeButton = styled.div<{
  open: boolean;
}>`
  display: flex;
  justify-content: flex-start;
  padding-left: ${props =>
    props.open ? props.theme.sideNav.maxWidth : props.theme.sideNav.minWidth}px;
`;

const StyledButton = styled(Button)`
  max-width: 200px;
  display: flex;
  justify-content: flex-end;
`;

const StyledApplicationName = styled.span`
  font-size: 15px;
  padding-left: 8px;
  &&:hover {
    text-decoration: none;
  }
`;
type AppViewerHeaderProps = RouteComponentProps<{ applicationId: string }> & {
  url?: string;
  open: boolean;
  permissionRequired: string;
  permissions: string[];
  currentApplicationDetails?: ApplicationPayload;
  fetchApplication: (applicationId: string) => void;
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const hasPermission = isPermitted(
    props.permissions,
    props.permissionRequired,
  );

  const {
    match: {
      params: { applicationId },
    },
    fetchApplication,
    currentApplicationDetails,
    open,
  } = props;

  useEffect(() => {
    fetchApplication(applicationId);
  }, [fetchApplication, applicationId]);

  return (
    <HeaderWrapper>
      {currentApplicationDetails && (
        <StyledHomeButton open={open}>
          <Link to={APPLICATIONS_URL}>
            <FormIcons.HOME_ICON
              height={20}
              width={20}
              color={"grey"}
              background={"grey"}
              onClick={() => {}}
              style={{ alignSelf: "center", cursor: "pointer" }}
            />
            <StyledApplicationName>
              {currentApplicationDetails.name}
            </StyledApplicationName>
          </Link>
        </StyledHomeButton>
      )}
      {props.url && hasPermission && (
        <StyledButton
          className="t--back-to-editor"
          href={props.url}
          intent="primary"
          icon="chevron-left"
          iconAlignment="left"
          text={BACK_TO_EDITOR}
          filled
        />
      )}
    </HeaderWrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  currentApplicationDetails: state.ui.applications.currentApplication,
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchApplication: (applicationId: string) => {
    return dispatch(fetchApplication(applicationId));
  },
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AppViewerHeader),
);
