import React, { useState } from "react";
import styled from "styled-components";
import { Variant } from "components/ads/common";
import Button from "components/ads/Button";
import { Callout } from "components/ads/CalloutV2";
import {
  createMessage,
  DANGER_ZONE,
  DISCONNECT_AUTH_METHOD,
  DISCONNECT_CONFIRMATION,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

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
  ${(props) => getTypographyByKey(props, "dangerHeading")}
  text-align: left;
`;

export const HeaderDanger = styled(Header)`
  color: ${Colors.CRIMSON};
`;

export const Info = styled.h3`
  display: block;
  ${(props) => getTypographyByKey(props, "p3")}
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
      <Callout desc={props.warning} type="Warning" />
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
