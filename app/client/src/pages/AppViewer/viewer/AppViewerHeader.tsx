import React from "react";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import Button from "components/editorComponents/Button";
import { EDIT_APP } from "constants/messages";
import { isPermitted } from "pages/Applications/permissionHelpers";
const HeaderWrapper = styled(StyledHeader)`
  position: fixed;
  top: 0;
  left: 0;
  background: white;
  display: flex;
  justify-content: flex-end;
`;

const StyledButton = styled(Button)`
  max-width: 200px;
`;
type AppViewerHeaderProps = {
  url?: string;
  permissionRequired: string;
  permissions: string[];
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  const hasPermission = isPermitted(
    props.permissions,
    props.permissionRequired,
  );

  return (
    <HeaderWrapper>
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
