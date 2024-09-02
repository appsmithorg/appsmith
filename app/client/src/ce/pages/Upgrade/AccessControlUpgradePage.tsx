import React from "react";
import type { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import SecureAppsLeastPrivilegeImage from "assets/images/upgrade/access-control/secure-apps-least-privilege.png";
import RestrictPublicExposureImage from "assets/images/upgrade/access-control/restrict-public-exposure.png";
import PreventAccidentalDamageImage from "assets/images/upgrade/access-control/prevent-accidental-damage.png";
import {
  ACCESS_CONTROL_UPGRADE_PAGE_FOOTER,
  ACCESS_CONTROL_UPGRADE_PAGE_SUB_HEADING,
  createMessage,
  GRANULAR_ACCESS_CONTROL_FOR_TEAMS,
  INTRODUCING,
  PREVENT_ACCIDENTAL_DAMAGE,
  PREVENT_ACCIDENTAL_DAMAGE_DETAIL1,
  RESTRICT_PUBLIC_EXPOSURE,
  RESTRICT_PUBLIC_EXPOSURE_DETAIL1,
  SECURITY_APPS_LEAST_PRIVILEGE,
  SECURITY_APPS_LEAST_PRIVILEGE_DETAIL1,
} from "ee/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import { RampFeature, RampSection } from "utils/ProductRamps/RampsControlList";

export function AccessControlUpgradePage() {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "GAC_UPGRADE_CLICK_ADMIN_SETTINGS",
    logEventData: { source: "Granular Access Control" },
    featureName: RampFeature.Gac,
    sectionName: RampSection.AdminSettings,
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
        icon: "user-shared-line",
        heading: createMessage(SECURITY_APPS_LEAST_PRIVILEGE),
        details: [createMessage(SECURITY_APPS_LEAST_PRIVILEGE_DETAIL1)],
      },
      {
        icon: "delete-row",
        heading: createMessage(PREVENT_ACCIDENTAL_DAMAGE),
        details: [createMessage(PREVENT_ACCIDENTAL_DAMAGE_DETAIL1)],
      },
      {
        icon: "eye-off",
        heading: createMessage(RESTRICT_PUBLIC_EXPOSURE),
        details: [createMessage(RESTRICT_PUBLIC_EXPOSURE_DETAIL1)],
      },
    ],
    targets: [
      <img
        alt={createMessage(SECURITY_APPS_LEAST_PRIVILEGE)}
        key="secure-apps-least-privilege"
        src={SecureAppsLeastPrivilegeImage}
      />,
      <img
        alt={createMessage(PREVENT_ACCIDENTAL_DAMAGE)}
        key="prevent-accidental-damage"
        src={PreventAccidentalDamageImage}
      />,
      <img
        alt={createMessage(RESTRICT_PUBLIC_EXPOSURE)}
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
