import React from "react";
import { NotificationBannerContainer } from "./StyledComponents";
import {
  createMessage,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
} from "ee/constants/messages";
import { Callout } from "@appsmith/ads";

/**
 * getNotificationBanner returns a notification banner about copying the key to repo settings.
 * @param learnMoreClickHandler {() => void} link that takes user to documentation
 * @param setShowKeyGeneratedMessage {( value: ((prevState: boolean) => boolean) | boolean ) => void}
 */
export default function getNotificationBanner(
  deployKeyDocUrl: string,
  learnMoreClickHandler: (e: React.MouseEvent) => void,
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
            children: "Learn more",
            onClick: learnMoreClickHandler,
            to: deployKeyDocUrl,
            target: "_blank",
          },
        ]}
        onClose={() => setShowKeyGeneratedMessage(false)}
      >
        {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
      </Callout>
    </NotificationBannerContainer>
  );
}
