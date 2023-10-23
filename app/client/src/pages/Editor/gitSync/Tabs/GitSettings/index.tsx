import React from "react";
import GitUserSettings from "./GitUserSettings";
import GitDisconnect from "./GitDisconnect";
import styled from "styled-components";
import { Divider, ModalBody } from "design-system";
import GitDefaultBranch from "./GitDefaultBranch";
import GitProtectedBranches from "./GitProtectedBranches";

const Container = styled.div`
  overflow: auto;
  min-height: calc(360px + 52px);
`;

const StyledDivider = styled(Divider)`
  display: block;
  margin-top: 8px;
  margin-bottom: 8px;
`;

function GitSettings() {
  return (
    <ModalBody>
      <Container>
        <GitUserSettings />
        <StyledDivider />
        <GitDefaultBranch />
        <GitProtectedBranches />
        <GitDisconnect />
      </Container>
    </ModalBody>
  );
}

export default GitSettings;
