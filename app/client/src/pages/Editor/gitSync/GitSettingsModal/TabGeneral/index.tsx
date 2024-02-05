import React from "react";
import GitUserSettings from "./GitUserSettings";
import DangerZone from "./DangerZone";
import styled from "styled-components";
import {
  useHasConnectToGitPermission,
  useHasManageAutoCommitPermission,
} from "../../hooks/gitPermissionHooks";

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
