import React, { useEffect } from "react";
import { Callout } from "design-system";
import {
  ADMIN_SETTINGS,
  LEARN_MORE,
  ONBOARDING_TELEMETRY_POPUP,
  createMessage,
} from "@appsmith/constants/messages";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import { TELEMETRY_DOCS_PAGE_URL } from "./constants";
import type { EventName } from "utils/AnalyticsUtil";
import AnalyticsUtil from "utils/AnalyticsUtil";

export default function AnonymousDataPopup(props: {
  onCloseCallout: () => void;
}) {
  useEffect(() => {
    AnalyticsUtil.logEvent("DISPLAY_TELEMETRY_CALLOUT");
  }, []);

  const handleLinkClick = (link: string) => {
    const eventName: { [key: string]: EventName } = {
      ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH:
        "VISIT_ADMIN_SETTINGS_TELEMETRY_CALLOUT",
      TELEMETRY_DOCS_PAGE_URL: "LEARN_MORE_TELEMETRY_CALLOUT",
    };
    AnalyticsUtil.logEvent(eventName[link]);
    window.open(link, "_blank");
  };

  return (
    <div className="absolute top-5">
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
        onClose={() => {
          props.onCloseCallout();
        }}
      >
        {createMessage(ONBOARDING_TELEMETRY_POPUP)}
      </Callout>
    </div>
  );
}
