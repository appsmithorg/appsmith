import React, { useEffect } from "react";
import { Callout } from "@appsmith/ads";
import {
  ADMIN_SETTINGS,
  LEARN_MORE,
  ONBOARDING_TELEMETRY_POPUP,
  createMessage,
} from "ee/constants/messages";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import {
  ANONYMOUS_DATA_POPOP_TIMEOUT,
  TELEMETRY_DOCS_PAGE_URL,
} from "./constants";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getFirstTimeUserOnboardingComplete,
  getIsAnonymousDataPopupVisible,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import {
  getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
  setFirstTimeUserOnboardingTelemetryCalloutVisibility,
} from "utils/storage";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { deleteCanvasCardsState } from "actions/editorActions";
import styled from "styled-components";
import { showAnonymousDataPopup } from "actions/onboardingActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const Wrapper = styled.div`
  margin: ${(props) =>
    `${props.theme.spaces[7]}px ${props.theme.spaces[16]}px 0px ${props.theme.spaces[13]}px`};
`;

export default function AnonymousDataPopup() {
  const user = useSelector(getCurrentUser);
  const isAdmin = user?.isSuperUser || false;
  const isOnboardingCompleted = useSelector(getFirstTimeUserOnboardingComplete);
  const isAnonymousDataPopupVisible = useSelector(
    getIsAnonymousDataPopupVisible,
  );
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const dispatch = useDispatch();

  const hideAnonymousDataPopup = () => {
    dispatch(showAnonymousDataPopup(false));
    setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
  };

  useEffect(() => {
    if (isAnonymousDataPopupVisible) {
      AnalyticsUtil.logEvent("DISPLAY_TELEMETRY_CALLOUT");
    }
  }, [isAnonymousDataPopupVisible]);

  const handleLinkClick = (link: string) => {
    if (link === ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH) {
      AnalyticsUtil.logEvent("VISIT_ADMIN_SETTINGS_TELEMETRY_CALLOUT");
    } else if (link === TELEMETRY_DOCS_PAGE_URL) {
      AnalyticsUtil.logEvent("LEARN_MORE_TELEMETRY_CALLOUT");
    }

    window.open(link, "_blank");
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
        dispatch(showAnonymousDataPopup(false));
      } else {
        dispatch(deleteCanvasCardsState());
        dispatch(showAnonymousDataPopup(true));
        setTimeout(() => {
          hideAnonymousDataPopup();
        }, ANONYMOUS_DATA_POPOP_TIMEOUT);
        await setFirstTimeUserOnboardingTelemetryCalloutVisibility(true);
      }
    } else {
      dispatch(showAnonymousDataPopup(shouldPopupShow));
    }
  };

  useEffect(() => {
    showShowAnonymousDataPopup();
  }, []);

  if (!isAnonymousDataPopupVisible) return null;

  return (
    <Wrapper className="z-[1] self-center">
      <Callout
        isClosable
        kind="info"
        links={[
          {
            children: createMessage(ADMIN_SETTINGS),
            onClick: () =>
              handleLinkClick(ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH),
          },
          {
            children: createMessage(LEARN_MORE),
            onClick: () => handleLinkClick(TELEMETRY_DOCS_PAGE_URL),
          },
        ]}
        onClose={hideAnonymousDataPopup}
      >
        {createMessage(ONBOARDING_TELEMETRY_POPUP)}
      </Callout>
    </Wrapper>
  );
}
