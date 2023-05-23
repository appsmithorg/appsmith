import React from "react";
import { Callout } from "design-system";
import {
  ADMIN_SETTINGS,
  LEARN_MORE,
  ONBOARDING_TELEMETRY_POPUP,
  createMessage,
} from "@appsmith/constants/messages";
import { ADMIN_SETTINGS_CATEGORY_DEFAULT_PATH } from "constants/routes";
import { TELEMETRY_DOCS_PAGE_URL } from "./constants";

export default function AnonymousDataPopup(props: {
  onCloseCallout: () => void;
}) {
  return (
    <div className="absolute top-5">
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
        onClose={() => {
          props.onCloseCallout();
        }}
      >
        {createMessage(ONBOARDING_TELEMETRY_POPUP)}
      </Callout>
    </div>
  );
}
