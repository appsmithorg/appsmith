import React from "react";
import LocalProfile from "../../LocalProfile";
import DangerZone from "../../DangerZone";
import styled from "styled-components";

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
      <LocalProfile />
      {showDangerZone && <DangerZone />}
    </Container>
  );
}

export default TabGeneral;
