import React from "react";
import styled from "styled-components";
import DefaultBranch from "../../DefaultBranch";
import ProtectedBranches from "../../ProtectedBranches";

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
      {showDefaultBranch && <DefaultBranch />}
      {showProtectedBranches && <ProtectedBranches />}
    </Container>
  );
}

export default TabBranch;
