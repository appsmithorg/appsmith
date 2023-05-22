import React from "react";
import { Callout } from "design-system";
import {
  ONBOARDING_TELEMETRY_POPUP,
  createMessage,
} from "ce/constants/messages";

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
            children: "Admin Settings",
            to: "/settings/general",
          },
          {
            children: "Learn more",
            to: "https://docs.appsmith.com/product/telemetry",
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
