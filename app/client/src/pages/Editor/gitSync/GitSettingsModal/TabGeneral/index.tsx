import React from "react";

import styled from "styled-components";

import {
  useHasConnectToGitPermission,
  useHasManageAutoCommitPermission,
} from "../../hooks/gitPermissionHooks";
import DangerZone from "./DangerZone";
import GitUserSettings from "./GitUserSettings";

const Container = styled.div`
  overflow: auto;
`;

function TabGeneral() {
  const isConnectToGitPermitted = useHasConnectToGitPermission();
  const isManageAutoCommitPermitted = useHasManageAutoCommitPermission();

  const showDangerZone = isConnectToGitPermitted || isManageAutoCommitPermitted;

  return (
    <Container>
      <GitUserSettings />
      {showDangerZone && <DangerZone />}
    </Container>
  );
}

export default TabGeneral;
