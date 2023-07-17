import React from "react";
import type { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import SecureAppsLeastPrivilegeImage from "assets/images/upgrade/access-control/secure-apps-least-privilege.png";
import PreventAccidentalDamageImage from "assets/images/upgrade/access-control/prevent-accidental-damage.png";
import {
  ACCESS_CONTROL_UPGRADE_PAGE_FOOTER,
  AUTO_GROUP_SYNC,
  AUTO_GROUP_SYNC_DETAIL1,
  createMessage,
  INTRODUCING,
  PROVISION_DEPROVISION_USERS,
  PROVISION_DEPROVISION_USERS_DETAIL1,
  PROVISIONING_UPGRADE_PAGE_SUB_HEADING,
  USER_PROVISIONING_FOR_ENTERPRISES,
} from "@appsmith/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export function ProvisioningUpgradePage() {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "PROVISIONING_UPGRADE_ADMIN_SETTINGS",
    logEventData: { source: "Provisioning" },
  });

  const header: Header = {
    heading: createMessage(
      INTRODUCING,
      createMessage(USER_PROVISIONING_FOR_ENTERPRISES),
    ),
    subHeadings: [createMessage(PROVISIONING_UPGRADE_PAGE_SUB_HEADING)],
  };
  const carousel: Carousel = {
    triggers: [
      {
        icon: "user-settings-line",
        heading: createMessage(PROVISION_DEPROVISION_USERS),
        details: [createMessage(PROVISION_DEPROVISION_USERS_DETAIL1)],
      },
      {
        icon: "group-line",
        heading: createMessage(AUTO_GROUP_SYNC),
        details: [createMessage(AUTO_GROUP_SYNC_DETAIL1)],
      },
    ],
    targets: [
      <img
        alt={createMessage(PROVISION_DEPROVISION_USERS)}
        key="provision-deprovision-users"
        src={SecureAppsLeastPrivilegeImage}
      />,
      <img
        alt={createMessage(AUTO_GROUP_SYNC)}
        key="auto-group-sync"
        src={PreventAccidentalDamageImage}
      />,
    ],
    design: "split-left-trigger",
  };
  const footer = {
    onClick: () => {
      onUpgrade();
    },
    message: createMessage(ACCESS_CONTROL_UPGRADE_PAGE_FOOTER),
    isEnterprise: true,
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
