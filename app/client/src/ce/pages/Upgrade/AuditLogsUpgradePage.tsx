import React from "react";
import { Carousel, Header } from "./types";
import UpgradePage from "./UpgradePage";
import DebuggingImage from "assets/svg/upgrade/audit-logs/debugging.svg";
import IncidentManagementImage from "assets/svg/upgrade/audit-logs/incident-management.svg";
import SecurityAndComplianceImage from "assets/svg/upgrade/audit-logs/security-and-compliance.svg";
import { createMessage } from "design-system/build/constants/messages";
import {
  AUDIT_LOGS,
  AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING,
  DEBUGGING,
  DEBUGGING_DETAIL1,
  EXCLUSIVE_TO_BUSINESS,
  INCIDENT_MANAGEMENT,
  INCIDENT_MANAGEMENT_DETAIL1,
  INTRODUCING,
  SECURITY_AND_COMPLIANCE,
  SECURITY_AND_COMPLIANCE_DETAIL1,
  SECURITY_AND_COMPLIANCE_DETAIL2,
  UPGRADE_TO_EE_FEATURE,
} from "@appsmith/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export function AuditLogsUpgradePage() {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_HOOK",
    logEventData: { source: "AuditLogs" },
    intercomMessage: createMessage(UPGRADE_TO_EE_FEATURE, "Audit Logs"),
  });

  const header: Header = {
    heading: createMessage(INTRODUCING, createMessage(AUDIT_LOGS)),
    subHeadings: [createMessage(AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING)],
  };
  const carousel: Carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: createMessage(SECURITY_AND_COMPLIANCE),
        details: [
          createMessage(SECURITY_AND_COMPLIANCE_DETAIL1),
          createMessage(SECURITY_AND_COMPLIANCE_DETAIL2),
        ],
      },
      {
        icon: "search-eye-line",
        heading: createMessage(DEBUGGING),
        details: [createMessage(DEBUGGING_DETAIL1)],
      },
      {
        icon: "alert-line",
        heading: createMessage(INCIDENT_MANAGEMENT),
        details: [createMessage(INCIDENT_MANAGEMENT_DETAIL1)],
      },
    ],
    targets: [
      <img
        alt="Security & Compliance"
        key="security-and-compliance"
        src={SecurityAndComplianceImage}
      />,
      <img alt="Debugging" key="debugging" src={DebuggingImage} />,
      <img
        alt="Incident management"
        key="incident-management"
        src={IncidentManagementImage}
      />,
    ],
    design: "split-left-trigger",
  };

  const footer = {
    onClick: () => {
      onUpgrade();
    },
    message: createMessage(EXCLUSIVE_TO_BUSINESS, ["audit logs"]),
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
