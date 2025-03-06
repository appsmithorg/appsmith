import React from "react";
import styled from "styled-components";
import ProtectedBranches from "../../ProtectedBranches";
import DefaultBranch from "git/ee/components/DefaultBranch";

const Container = styled.div`
  overflow: auto;
  min-height: 280px;
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
