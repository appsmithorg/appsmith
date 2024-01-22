import React from "react";
import styled from "styled-components";
import { ModalBody } from "design-system";
import GitDefaultBranch from "./GitDefaultBranch";
import GitProtectedBranches from "./GitProtectedBranches";
import {
  useHasManageDefaultBranchPermission,
  useHasManageProtectedBranchesPermission,
} from "../../hooks/gitPermissionHooks";

const Container = styled.div`
  overflow: auto;
  min-height: calc(360px + 52px);
`;

function TabBranch() {
  const isManageProtectedBranchesPermitted =
    useHasManageProtectedBranchesPermission();
  const isManageDefaultBranchPermitted = useHasManageDefaultBranchPermission();

  const showDefaultBranch = isManageDefaultBranchPermitted;
  const showProtectedBranches = isManageProtectedBranchesPermitted;

  return (
    <ModalBody>
      <Container>
        {showDefaultBranch && <GitDefaultBranch />}
        {showProtectedBranches && <GitProtectedBranches />}
      </Container>
    </ModalBody>
  );
}

export default TabBranch;
