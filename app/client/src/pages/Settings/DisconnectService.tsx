import React, { useState } from "react";
import styled from "styled-components";
import { CalloutV2, getTypographyByKey } from "design-system-old";
import { Button } from "design-system";
import {
  createMessage,
  DANGER_ZONE,
  DISCONNECT_AUTH_METHOD,
  DISCONNECT_CONFIRMATION,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";

export const Container = styled.div`
  width: 100%;
  padding: 16px 0;
`;

export const Header = styled.h2`
  ${getTypographyByKey("dangerHeading")}
  text-align: left;
`;

export const HeaderDanger = styled(Header)`
  color: ${Colors.CRIMSON};
`;

export const Info = styled.h3`
  display: block;
  ${getTypographyByKey("p3")}
  text-align: left;
  margin: 8px 0;
`;

export function DisconnectService(props: {
  disconnect: () => void;
  subHeader: string;
  warning: string;
}) {
  const [warnDisconnectAuth, setWarnDisconnectAuth] = useState(false);
  const [disconnectCalled, setDisconnectCalled] = useState(false);

  const callDisconnect = () => {
    if (!disconnectCalled) {
      setDisconnectCalled(true);
      props.disconnect();
    }
  };

  return (
    <Container>
      <HeaderDanger>{createMessage(DANGER_ZONE)}</HeaderDanger>
      <Info>{props.subHeader}</Info>
      <CalloutV2 desc={props.warning} type="Warning" />
      <Button
        data-testid="disconnect-service-button"
        kind="error"
        onClick={() =>
          warnDisconnectAuth ? callDisconnect() : setWarnDisconnectAuth(true)
        }
      >
        {warnDisconnectAuth
          ? createMessage(DISCONNECT_CONFIRMATION)
          : createMessage(DISCONNECT_AUTH_METHOD)}
      </Button>
    </Container>
  );
}
