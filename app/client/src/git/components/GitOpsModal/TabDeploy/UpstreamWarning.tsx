import React from "react";

import { Callout } from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  GIT_UPSTREAM_CHANGES,
  READ_DOCUMENTATION,
} from "ee/constants/messages";

export default function UpstreamWarning() {
  return (
    <Callout
      kind="warning"
      links={[
        {
          children: createMessage(READ_DOCUMENTATION),
          onClick: () => {
            AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
              source: "UPSTREAM_CHANGES_LINK_ON_GIT_DEPLOY_MODAL",
            });
          },
          // ! case: should be a constant
          to: "https://docs.appsmith.com/advanced-concepts/version-control-with-git",
          target: "_blank",
        },
      ]}
      style={{ marginBottom: 12 }}
    >
      {createMessage(GIT_UPSTREAM_CHANGES)}
    </Callout>
  );
}
