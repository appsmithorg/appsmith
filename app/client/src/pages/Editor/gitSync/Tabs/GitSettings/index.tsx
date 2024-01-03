import React from "react";
import GitUserSettings from "./GitUserSettings";
import DangerZone from "./DangerZone";
import styled from "styled-components";
import { Divider, ModalBody } from "design-system";
import GitDefaultBranch from "./GitDefaultBranch";
import GitProtectedBranches from "./GitProtectedBranches";
import {
  useHasConnectToGitPermission,
  useHasManageDefaultBranchPermission,
  useHasManageProtectedBranchesPermission,
  useHasManageAutoCommitPermission,
} from "../../hooks/gitPermissionHooks";

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
  const isManageProtectedBranchesPermitted =
    useHasManageProtectedBranchesPermission();
  const isManageDefaultBranchPermitted = useHasManageDefaultBranchPermission();
  const isConnectToGitPermitted = useHasConnectToGitPermission();
  const isManageAutoCommitPermitted = useHasManageAutoCommitPermission();

  return (
    <ModalBody>
      <Container>
        <GitUserSettings />
        {(isManageDefaultBranchPermitted ||
          isManageProtectedBranchesPermitted) && <StyledDivider />}
        {isManageDefaultBranchPermitted && <GitDefaultBranch />}
        {isManageProtectedBranchesPermitted && <GitProtectedBranches />}
        {(isConnectToGitPermitted || isManageAutoCommitPermitted) && (
          <DangerZone />
        )}
      </Container>
    </ModalBody>
  );
}

export default GitSettings;
