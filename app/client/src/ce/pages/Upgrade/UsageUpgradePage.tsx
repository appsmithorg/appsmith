import React from "react";
import { Carousel, Header } from "./types";
import { createMessage } from "design-system/build/constants/messages";
import { USAGE_AND_BILLING } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import UpgradePage from "./UpgradePage";
import { getAppsmithConfigs } from "../../configs";
import { FontWeight, Text, TextType } from "design-system";

const { intercomAppID } = getAppsmithConfigs();

export function UsageUpgradePage() {
  const header: Header = {
    heading: createMessage(USAGE_AND_BILLING.usage),
    subHeadings: [createMessage(USAGE_AND_BILLING.sell)],
  };
  const carousel: Carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: createMessage(USAGE_AND_BILLING.usageOverNDays, 20),
        details: [createMessage(USAGE_AND_BILLING.usageDetails)],
      },
      {
        icon: "search-eye-line",
        heading: createMessage(USAGE_AND_BILLING.rbacHeading),
        details: [createMessage(USAGE_AND_BILLING.rbacDetails)],
      },
      {
        icon: "alert-line",
        heading: createMessage(USAGE_AND_BILLING.ssoHeading),
        details: [createMessage(USAGE_AND_BILLING.ssoDetails)],
      },
      {
        icon: "alert-line",
        heading: createMessage(USAGE_AND_BILLING.gitHeading),
        details: [createMessage(USAGE_AND_BILLING.gitDetails)],
      },
    ],
    targets: [
      <div key={"usage-over-past-n-days"}>
        <div>
          <Text type={TextType.H1} weight={FontWeight.BOLD}>
            201
          </Text>
          &nbsp;
          <Text type={TextType.P1}>
            {createMessage(USAGE_AND_BILLING.unit)}{" "}
          </Text>
        </div>
        <div>
          <Text type={TextType.P3}>
            {createMessage(USAGE_AND_BILLING.averaged)}{" "}
            {createMessage(USAGE_AND_BILLING.approximated)}
          </Text>
        </div>
      </div>,
      null,
      null,
      null,
    ],
    design: "trigger-contains-target",
  };

  const footer = {
    onClick: () => {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_UPGRADE_HOOK", {
        source: "Usage",
      });
      if (intercomAppID && window.Intercom) {
        window.Intercom(
          "showNewMessage",
          createMessage(USAGE_AND_BILLING.upgradeToBusiness),
        );
      }
    },
    message: createMessage(USAGE_AND_BILLING.exclusive),
  };

  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
