import React, { useEffect, useState } from "react";
import { Callout } from "design-system";
import {
  ADMIN_SETTINGS,
  LEARN_MORE,
  ONBOARDING_TELEMETRY_POPUP,
  createMessage,
} from "@appsmith/constants/messages";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import {
  ANONYMOUS_DATA_POPOP_TIMEOUT,
  TELEMETRY_DOCS_PAGE_URL,
} from "./constants";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import {
  getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
  setFirstTimeUserOnboardingTelemetryCalloutVisibility,
} from "utils/storage";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

export default function AnonymousDataPopup() {
  const user = useSelector(getCurrentUser);
  const isAdmin = user?.isSuperUser || false;
  const isOnboardingCompleted = useSelector(getFirstTimeUserOnboardingComplete);
  const [isAnonymousDataPopupOpen, setisAnonymousDataPopupOpen] =
    useState(false);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );

  const hideAnonymousDataPopup = () => {
    setisAnonymousDataPopupOpen(false);
    setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
  };

  const showShowAnonymousDataPopup = async () => {
    const shouldPopupShow =
      !isAirgapped() &&
      isFirstTimeUserOnboardingEnabled &&
      isAdmin &&
      !isOnboardingCompleted;
    if (shouldPopupShow) {
      const isAnonymousDataPopupAlreadyOpen =
        await getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown();
      //true if the modal was already shown else show the modal and set to already shown, also hide the modal after 10 secs
      if (isAnonymousDataPopupAlreadyOpen) {
        setisAnonymousDataPopupOpen(false);
      } else {
        setisAnonymousDataPopupOpen(true);
        setTimeout(() => {
          hideAnonymousDataPopup();
        }, ANONYMOUS_DATA_POPOP_TIMEOUT);
        await setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
      }
    } else {
      setisAnonymousDataPopupOpen(shouldPopupShow);
    }
  };

  useEffect(() => {
    showShowAnonymousDataPopup();
  }, []);

  if (!isAnonymousDataPopupOpen) return null;

  return (
    <div className="absolute top-24 z-[1] self-center">
      <Callout
        isClosable
        kind="info"
        links={[
          {
            children: createMessage(ADMIN_SETTINGS),
            to: ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH,
          },
          {
            children: createMessage(LEARN_MORE),
            to: TELEMETRY_DOCS_PAGE_URL,
          },
        ]}
        onClose={hideAnonymousDataPopup}
      >
        {createMessage(ONBOARDING_TELEMETRY_POPUP)}
      </Callout>
    </div>
  );
}
