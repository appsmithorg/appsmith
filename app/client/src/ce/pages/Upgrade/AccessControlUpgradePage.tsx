import React from "react";
import { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import SecureAppsLeastPrivilegeImage from "assets/svg/upgrade/access-control/secure-apps-least-privilege.png";
import RestrictPublicExposureImage from "assets/svg/upgrade/access-control/restrict-public-exposure.png";
import PreventAccidentalDamageImage from "assets/svg/upgrade/access-control/prevent-accidental-damage.png";

export function AccessControlUpgradePage() {
  const header: Header = {
    heading: "Introducing Granular Access Controls for teams",
    subHeadings: [
      "Control view, create, edit, delete, share, and export permissions for all resources in your apps in a workspace. Manage permissions by attributes as granularly or broadly as you want. Use permissions and user groups to easily define access levels of new and existing users.",
    ],
  };
  const carousel: Carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: "Secure apps by the least privilege needed",
        details: [
          `Create roles by the least privilege needed as defaults, e.g.: View only, assign them to users in groups, e.g.: Marketing, and modify for special access, e.g.: Content creators_Execute queries`,
        ],
      },
      {
        icon: "search-eye-line",
        heading: "Prevent accidental damage to data",
        details: [
          `Assign edit and delete permissions to an entire group, then modify granularly so non-native users of your data don’t drop a table or bulk-delete streaming data records before you can say, “Retrieve”.`,
        ],
      },
      {
        icon: "alert-line",
        heading: "Restrict public exposure of sensitive data",
        details: [
          `Proactively disallow groups of non-admin or non-super-admin users from publicly sharing your app or exporting app data out of your environment, domain, and security perimeters.`,
        ],
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
    onClick: () => null,
    message:
      "Unlock granular access controls along with audit logs and SSO for enhanced security and reliability with an upgrade to our Business edition.",
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
