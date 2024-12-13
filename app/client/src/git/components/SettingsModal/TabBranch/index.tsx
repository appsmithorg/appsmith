import React from "react";
import styled from "styled-components";
import GitDefaultBranch from "../../GitDefaultBranch";
import GitProtectedBranches from "../../GitProtectedBranches";

const Container = styled.div`
  overflow: auto;
`;

interface TabBranchProps {
  isManageDefaultBranchPermitted: boolean;
  isManageProtectedBranchesPermitted: boolean;
}

function TabBranch({
  isManageDefaultBranchPermitted = false,
  isManageProtectedBranchesPermitted = false,
}: TabBranchProps) {
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
