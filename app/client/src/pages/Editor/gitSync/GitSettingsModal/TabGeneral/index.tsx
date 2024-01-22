import React from "react";
import GitUserSettings from "./GitUserSettings";
import DangerZone from "./DangerZone";
import styled from "styled-components";
import { ModalBody } from "design-system";
import {
  useHasConnectToGitPermission,
  useHasManageAutoCommitPermission,
} from "../../hooks/gitPermissionHooks";

const Container = styled.div`
  overflow: auto;
  min-height: calc(360px + 52px);
`;

function TabGeneral() {
  const isConnectToGitPermitted = useHasConnectToGitPermission();
  const isManageAutoCommitPermitted = useHasManageAutoCommitPermission();

  const showDangerZone = isConnectToGitPermitted || isManageAutoCommitPermitted;

  return (
    <ModalBody>
      <Container>
        <GitUserSettings />
        {showDangerZone && <DangerZone />}
      </Container>
    </ModalBody>
  );
}

export default TabGeneral;
