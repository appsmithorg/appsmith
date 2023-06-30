import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Callout, Text } from "design-system";
import type { ProductAlertState } from "reducers/uiReducers/usersReducer";
import { setMessageConfig } from "@appsmith/sagas/userSagas";
import type { CalloutLinkProps } from "design-system/build/Callout/Callout.types";
import moment from "moment/moment";

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
  const [dismissed, setDismissed] = useState(false);

  if (!message) return null;

  // If dismissed, it will not be shown
  if ((config && config.dismissed) || dismissed) return null;

  // If still snoozed, it will not be shown
  if (config && config.snoozeTill) {
    const stillSnoozed = moment().isBefore(moment(config.snoozeTill));
    if (stillSnoozed) {
      return null;
    }
  }

  const links: CalloutLinkProps[] = [];

  if (message.learnMoreLink) {
    links.push({
      children: "Learn More",
      to: message.learnMoreLink,
    });
  }

  if (message.canDismiss) {
    links.push({
      children: "Dismiss",
      onClick: () => {
        setMessageConfig(message.messageId, {
          dismissed: true,
          snoozeTill: new Date(),
        });
        setDismissed(true);
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
          if (message.remindLaterDays) {
            setMessageConfig(message.messageId, {
              dismissed: false,
              snoozeTill: moment()
                .add(message.remindLaterDays, "days")
                .toDate(),
            });
          }

          setDismissed(true);
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
