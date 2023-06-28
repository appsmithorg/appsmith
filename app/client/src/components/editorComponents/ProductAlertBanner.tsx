import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Callout, Text } from "design-system";
import type { ProductAlertState } from "reducers/uiReducers/usersReducer";
import { setMessageConfig } from "@appsmith/sagas/userSagas";

const AlertContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const ProductAlertBanner = () => {
  const { config, message }: ProductAlertState | undefined = useSelector(
    (state) => state.ui.users.productAlert,
  );

  if (!message) return null;
  if (config && config.dismissed) return null;

  // check if still snoozed

  const links = [];

  if (message.learnMoreLink) {
    links.push({
      children: "Learn More",
      onClick: () => {
        window.open(message.learnMoreLink, "_blank");
      },
    });
  }

  if (message.canDismiss) {
    links.push({
      children: "Dismiss",
      onClick: () => {
        setMessageConfig(message.messageId, {
          dismissed: true,
          snoozedOn: new Date(),
        });
      },
    });
  }

  return (
    <AlertContainer>
      <Callout
        isClosable={message.remindLaterDays > 0}
        kind={"warning"}
        links={links}
        onClose={() => {
          setMessageConfig(message.messageId, {
            dismissed: false,
            snoozedOn: new Date(),
          });
        }}
      >
        <Text kind={"heading-s"}>{message.title}</Text>
        <br />
        <span>{message.message}</span>
      </Callout>
    </AlertContainer>
  );
};

export default ProductAlertBanner;
