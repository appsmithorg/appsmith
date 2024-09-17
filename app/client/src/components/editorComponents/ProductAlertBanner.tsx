import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Callout, Text } from "@appsmith/ads";
import type {
  ProductAlertConfig,
  ProductAlertState,
} from "reducers/uiReducers/usersReducer";
import { setMessageConfig } from "ee/sagas/userSagas";
import type { CalloutLinkProps } from "@appsmith/ads";
import moment from "moment/moment";
import { createMessage, I_UNDERSTAND, LEARN_MORE } from "ee/constants/messages";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { updateProductAlertConfig } from "actions/userActions";
import { getIsUserLoggedIn } from "selectors/usersSelectors";

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
  const dispatch = useDispatch();

  const [isShown, setIsShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isSignpostingOverlayOpen = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const userIsLoggedIn = useSelector(getIsUserLoggedIn);
  const { config, message }: ProductAlertState | undefined = useSelector(
    (state) => state.ui.users.productAlert,
  );

  const updateConfig = useCallback(
    (messageId: string, config: ProductAlertConfig) => {
      dispatch(updateProductAlertConfig(config));
      setMessageConfig(messageId, config);
    },
    [],
  );

  // Delay showing the message.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isShown) return null;

  if (!userIsLoggedIn) return null;
  if (isSignpostingOverlayOpen) return null;

  if (!message) return null;
  // If dismissed, it will not be shown
  if (config && config.dismissed) return null;
  if (dismissed) return null;

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
      target: "_blank",
    });
  }

  if (message.canDismiss) {
    links.push({
      children: createMessage(I_UNDERSTAND),
      onClick: () => {
        updateConfig(message.messageId, {
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
              updateConfig(message.messageId, {
                dismissed: false,
                snoozeTill: moment()
                  .add(message.remindLaterDays, "days")
                  .toDate(),
              });
            } else if (message.canDismiss) {
              updateConfig(message.messageId, {
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
