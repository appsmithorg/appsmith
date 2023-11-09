import React from "react";
import GitUserSettings from "./GitUserSettings";
import GitDisconnect from "./GitDisconnect";
import styled from "styled-components";
import { Divider, ModalBody } from "design-system";
import GitDefaultBranch from "./GitDefaultBranch";
import GitProtectedBranches from "./GitProtectedBranches";
import { useSelector } from "react-redux";
import { getIsGitProtectedFeatureEnabled } from "selectors/gitSyncSelectors";
import { useIsGitAdmin } from "../../hooks/useIsGitAdmin";

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
  const isGitProtectedFeatureEnabled = useSelector(
    getIsGitProtectedFeatureEnabled,
  );
  const isGitAdmin = useIsGitAdmin();

  return (
    <ModalBody>
      <Container>
        <GitUserSettings />
        {isGitProtectedFeatureEnabled && isGitAdmin ? (
          <>
            <StyledDivider />
            <GitDefaultBranch />
            <GitProtectedBranches />
          </>
        ) : null}
        {isGitAdmin && <GitDisconnect />}
      </Container>
    </ModalBody>
  );
}

export default GitSettings;
