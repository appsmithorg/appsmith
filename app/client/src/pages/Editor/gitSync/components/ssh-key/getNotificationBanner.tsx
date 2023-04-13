import React from "react";
import { NotificationBannerContainer } from "./StyledComponents";
import {
  createMessage,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
} from "@appsmith/constants/messages";
import { Callout } from "design-system";

/**
 * getNotificationBanner returns a notification banner about copying the key to repo settings.
 * @param link
 * @param learnMoreClickHandler {() => void} link that takes user to documentation
 * @param setShowKeyGeneratedMessage {( value: ((prevState: boolean) => boolean) | boolean ) => void}
 */
export default function getNotificationBanner(
  link: string,
  learnMoreClickHandler: () => void,
  setShowKeyGeneratedMessage: (value: boolean) => void,
): JSX.Element {
  return (
    <NotificationBannerContainer>
      <Callout
        className={"enterprise"}
        data-testid="t--deploy-key-usage-guide-message"
        isClosable
        links={[
          {
            children: "Learn More",
            to: link,
            onClick: learnMoreClickHandler,
          },
        ]}
        onClose={() => setShowKeyGeneratedMessage(false)}
      >
        {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
      </Callout>
    </NotificationBannerContainer>
  );
}
