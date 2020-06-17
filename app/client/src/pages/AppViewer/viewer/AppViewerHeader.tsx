import React from "react";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import Button from "components/editorComponents/Button";
import { BACK_TO_EDITOR } from "constants/messages";
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
};

export const AppViewerHeader = (props: AppViewerHeaderProps) => {
  return (
    <HeaderWrapper>
      {props.url && (
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

export default AppViewerHeader;
