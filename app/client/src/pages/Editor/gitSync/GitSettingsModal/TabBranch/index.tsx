import React from "react";

import styled from "styled-components";

import {
  useHasManageDefaultBranchPermission,
  useHasManageProtectedBranchesPermission,
} from "../../hooks/gitPermissionHooks";
import GitDefaultBranch from "./GitDefaultBranch";
import GitProtectedBranches from "./GitProtectedBranches";

const Container = styled.div`
  overflow: auto;
`;

function TabBranch() {
  const isManageProtectedBranchesPermitted =
    useHasManageProtectedBranchesPermission();
  const isManageDefaultBranchPermitted = useHasManageDefaultBranchPermission();

  const showDefaultBranch = isManageDefaultBranchPermitted;
  const showProtectedBranches = isManageProtectedBranchesPermitted;

  return (
    <Container>
      {showDefaultBranch && <GitDefaultBranch />}
      {showProtectedBranches && <GitProtectedBranches />}
    </Container>
  );
}

export default TabBranch;
