import React from "react";
import LocalProfile from "../../LocalProfile";
import DangerZone from "../../DangerZone";
import styled from "styled-components";
import InvalidKeyWarning from "./InvalidKeyWarning";

const Container = styled.div`
  overflow: auto;
  min-height: 280px;
`;

interface TabGeneralProps {
  isConnectPermitted: boolean;
  isManageAutocommitPermitted: boolean;
}

function TabGeneral({
  isConnectPermitted = false,
  isManageAutocommitPermitted = false,
}: TabGeneralProps) {
  const showDangerZone = isConnectPermitted || isManageAutocommitPermitted;

  return (
    <Container>
      <InvalidKeyWarning />
      <LocalProfile />
      {showDangerZone && <DangerZone />}
    </Container>
  );
}

export default TabGeneral;
