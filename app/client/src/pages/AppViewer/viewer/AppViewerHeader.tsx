import React from "react";
import { Link } from "react-router-dom";
import { noop } from "lodash";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import { FormIcons } from "icons/FormIcons";
import Button from "components/editorComponents/Button";
import { EDIT_APP } from "constants/messages";
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
  && a {
    :hover {
      text-decoration: none;
    }
    color: ${props => props.theme.colors.textDefault};
  }
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
`;
type AppViewerHeaderProps = {
  url?: string;
  open: boolean;
  permissionRequired: string;
  permissions: string[];
  currentApplicationDetails?: ApplicationPayload;
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const hasPermission = isPermitted(
    props.permissions,
    props.permissionRequired,
  );

  const { currentApplicationDetails, open } = props;

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
              onClick={noop}
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
          text={EDIT_APP}
          filled
        />
      )}
    </HeaderWrapper>
  );
};

export default AppViewerHeader;
