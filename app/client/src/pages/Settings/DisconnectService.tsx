import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  CalloutV2,
  getTypographyByKey,
  Variant,
} from "design-system-old";
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

export const DisconnectButton = styled(Button)`
  display: inline-block;
  padding: 10px 20px;
  min-width: 152px;
  text-align: center;
  font-size: 13px;
  height: 38px;
  background: ${Colors.CRIMSON};
  border: 2px solid ${Colors.CRIMSON};

  &:hover {
    border: 2px solid ${Colors.CRIMSON};
  }
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
      <DisconnectButton
        data-testid="disconnect-service-button"
        onClick={() =>
          warnDisconnectAuth ? callDisconnect() : setWarnDisconnectAuth(true)
        }
        text={
          warnDisconnectAuth
            ? createMessage(DISCONNECT_CONFIRMATION)
            : createMessage(DISCONNECT_AUTH_METHOD)
        }
        variant={Variant.danger}
      />
    </Container>
  );
}
