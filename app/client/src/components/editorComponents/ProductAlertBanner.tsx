import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Callout, Text } from "design-system";
import type { ProductAlertState } from "reducers/uiReducers/usersReducer";
import { setMessageConfig } from "@appsmith/sagas/userSagas";
import type { CalloutLinkProps } from "design-system/build/Callout/Callout.types";
import moment from "moment/moment";
import {
  createMessage,
  I_UNDERSTAND,
  LEARN_MORE,
} from "@appsmith/constants/messages";
import { getIsFirstTimeUserOnboardingEnabled } from "../../selectors/onboardingSelectors";

const AlertContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const AnimationContainer = styled.div`
  animation-duration: 0.75s;
  animation-delay: 0.5s;
  animation-name: animate-slide;
  animation-timing-function: cubic-bezier(0.26, 0.53, 0.74, 1.48);
  animation-fill-mode: backwards;

  @keyframes animate-slide {
    0% {
      opacity: 0;
      transform: translate(0,50px);
    }
    100% {
      opacity: 1;
      transform: translate(0,0);
    }
`;

const ProductAlertBanner = () => {
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const { config, message }: ProductAlertState | undefined = useSelector(
    (state) => state.ui.users.productAlert,
  );
  const [dismissed, setDismissed] = useState(false);

  if (isFirstTimeUserOnboardingEnabled) return null;
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
      children: createMessage(LEARN_MORE),
      to: message.learnMoreLink,
    });
  }

  if (message.canDismiss) {
    links.push({
      children: createMessage(I_UNDERSTAND),
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
      <AnimationContainer>
        <Callout
          isClosable={message.remindLaterDays > 0 || message.canDismiss}
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
            } else if (message.canDismiss) {
              setMessageConfig(message.messageId, {
                dismissed: true,
                snoozeTill: new Date(),
              });
            }
            setDismissed(true);
          }}
        >
          <Text kind={"heading-s"}>{message.title}</Text>
          <br />
          <span>{message.message}</span>
        </Callout>
      </AnimationContainer>
    </AlertContainer>
  );
};

export default ProductAlertBanner;
