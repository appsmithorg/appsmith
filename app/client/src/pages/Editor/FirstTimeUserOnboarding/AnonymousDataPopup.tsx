import React from "react";
import { Callout } from "design-system";

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
        We only collect usage data to make Appsmith better for everyone. Visit
        admin settings to toggle this off.
      </Callout>
    </div>
  );
}
