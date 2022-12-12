import React from "react";
import { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import SecureAppsLeastPrivilegeImage from "assets/svg/upgrade/access-control/secure-apps-least-privilege.png";
import RestrictPublicExposureImage from "assets/svg/upgrade/access-control/restrict-public-exposure.png";
import PreventAccidentalDamageImage from "assets/svg/upgrade/access-control/prevent-accidental-damage.png";
import { createMessage } from "design-system/build/constants/messages";
import {
  ACCESS_CONTROL_UPGRADE_PAGE_FOOTER,
  ACCESS_CONTROL_UPGRADE_PAGE_SUB_HEADING,
  GRANULAR_ACCESS_CONTROL_FOR_TEAMS,
  INTRODUCING,
  PREVENT_ACCIDENTAL_DAMAGE,
  PREVENT_ACCIDENTAL_DAMAGE_DETAIL1,
  RESTRICT_PUBLIC_EXPOSURE,
  RESTRICT_PUBLIC_EXPOSURE_DETAIL1,
  SECURITY_APPS_LEAST_PRIVILEGE,
  SECURITY_APPS_LEAST_PRIVILEGE_DETAIL1,
  UPGRADE_TO_EE_FEATURE,
} from "@appsmith/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export function AccessControlUpgradePage() {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_HOOK",
    logEventData: { source: "Granular Access Control" },
    intercomMessage: createMessage(
      UPGRADE_TO_EE_FEATURE,
      "Granular Access Control for teams",
    ),
  });

  const header: Header = {
    heading: createMessage(
      INTRODUCING,
      createMessage(GRANULAR_ACCESS_CONTROL_FOR_TEAMS),
    ),
    subHeadings: [createMessage(ACCESS_CONTROL_UPGRADE_PAGE_SUB_HEADING)],
  };
  const carousel: Carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: createMessage(SECURITY_APPS_LEAST_PRIVILEGE),
        details: [createMessage(SECURITY_APPS_LEAST_PRIVILEGE_DETAIL1)],
      },
      {
        icon: "search-eye-line",
        heading: createMessage(PREVENT_ACCIDENTAL_DAMAGE),
        details: [createMessage(PREVENT_ACCIDENTAL_DAMAGE_DETAIL1)],
      },
      {
        icon: "alert-line",
        heading: createMessage(RESTRICT_PUBLIC_EXPOSURE),
        details: [createMessage(RESTRICT_PUBLIC_EXPOSURE_DETAIL1)],
      },
    ],
    targets: [
      <img
        alt="Secure apps by the least privilege needed"
        key="secure-apps-least-privilege"
        src={SecureAppsLeastPrivilegeImage}
      />,
      <img
        alt="Prevent accidental damage to data"
        key="prevent-accidental-damage"
        src={PreventAccidentalDamageImage}
      />,
      <img
        alt="Restrict public exposure of sensitive data"
        key="restrict-exposure-sensitive-data"
        src={RestrictPublicExposureImage}
      />,
    ],
    design: "split-left-trigger",
  };
  const footer = {
    onClick: () => {
      onUpgrade();
    },
    message: createMessage(ACCESS_CONTROL_UPGRADE_PAGE_FOOTER),
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
