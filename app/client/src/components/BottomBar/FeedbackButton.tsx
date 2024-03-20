import React from "react";
import { getIDETypeByUrl } from "@appsmith/entities/IDE/utils";
import { useLocation } from "react-router";
import { IDE_TYPE } from "@appsmith/entities/IDE/constants";
import { Button } from "design-system";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";

const { cloudHosting, intercomAppID } = getAppsmithConfigs();

export const FeedbackButton = () => {
  const { pathname } = useLocation();
  const ideType = getIDETypeByUrl(pathname);
  const user = useSelector(getCurrentUser);

  const handleFeedbackClick = () => {
    if (intercomAppID && window.Intercom) {
      window.Intercom(
        "showNewMessage",
        `Hi there,
do you have feedback about our new side-by-side layout and your experience while using it? We would love to hear what you have to say!`,
      );
    }
  };

  /** Intercom checks **/
  // User type safety checks
  if (!user) {
    return null;
  }
  // Check if intercom is configured
  if (!intercomAppID || !window.Intercom) {
    return null;
  }
  // Check for user consent
  if (!user.isIntercomConsentGiven || !cloudHosting) {
    return null;
  }

  // Only show this button on the app IDE (not even view mode)
  if (ideType !== IDE_TYPE.App) {
    return null;
  }

  return (
    <div>
      <Button
        data-testid="t--ide-feedback-button"
        kind="tertiary"
        onClick={handleFeedbackClick}
        size="md"
        startIcon="message-2-line"
      >
        Send Feedback
      </Button>
    </div>
  );
};
