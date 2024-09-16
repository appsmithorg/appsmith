import React from "react";
import type { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import ProvisionDeprovisionUsersImage from "assets/images/upgrade/provisioning/provision-deprovision-users.svg";
import AutoGroupSyncImage from "assets/images/upgrade/provisioning/auto-group-sync.svg";
import {
  AUTO_GROUP_SYNC,
  AUTO_GROUP_SYNC_DETAIL1,
  createMessage,
  PROVISION_DEPROVISION_USERS,
  PROVISION_DEPROVISION_USERS_DETAIL1,
  PROVISIONING_UPGRADE_PAGE_FOOTER,
  PROVISIONING_UPGRADE_PAGE_SUB_HEADING,
  USER_PROVISIONING_FOR_ENTERPRISES,
} from "ee/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import { RampFeature, RampSection } from "utils/ProductRamps/RampsControlList";

export function ProvisioningUpgradePage() {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "PROVISIONING_UPGRADE_ADMIN_SETTINGS",
    logEventData: { source: "Provisioning" },
    featureName: RampFeature.Provisioning,
    sectionName: RampSection.AdminSettings,
    isEnterprise: true,
  });

  const header: Header = {
    heading: createMessage(USER_PROVISIONING_FOR_ENTERPRISES),
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
        src={ProvisionDeprovisionUsersImage}
      />,
      <img
        alt={createMessage(AUTO_GROUP_SYNC)}
        key="auto-group-sync"
        src={AutoGroupSyncImage}
      />,
    ],
    design: "split-left-trigger",
  };
  const footer = {
    onClick: () => {
      onUpgrade();
    },
    message: createMessage(PROVISIONING_UPGRADE_PAGE_FOOTER),
    isEnterprise: true,
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
