import React, { useState } from "react";
import styled from "styled-components";
import { Button, Callout, Text } from "@appsmith/ads";
import {
  createMessage,
  DANGER_ZONE,
  DISCONNECT_AUTH_METHOD,
  DISCONNECT_CONFIRMATION,
} from "ee/constants/messages";

export const Container = styled.div`
  width: 100%;
  padding: 16px 0;

  > *:not(:first-child) {
    margin: 8px 0;
  }
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
      <Text color="var(--ads-v2-color-fg-error)" kind="heading-l" renderAs="h2">
        {createMessage(DANGER_ZONE)}
      </Text>
      <Text renderAs="h3">{props.subHeader}</Text>
      <Callout kind="error">{props.warning}</Callout>
      <Button
        data-testid="disconnect-service-button"
        isLoading={disconnectCalled}
        kind="error"
        onClick={() =>
          warnDisconnectAuth ? callDisconnect() : setWarnDisconnectAuth(true)
        }
        size="md"
      >
        {warnDisconnectAuth
          ? createMessage(DISCONNECT_CONFIRMATION)
          : createMessage(DISCONNECT_AUTH_METHOD)}
      </Button>
    </Container>
  );
}
