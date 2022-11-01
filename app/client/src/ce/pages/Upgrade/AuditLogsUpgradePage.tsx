import React from "react";
import { Header } from "./types";
import UpgradePage from "./UpgradePage";
import DebuggingImage from "assets/svg/upgrade/audit-logs/debugging.svg";
import IncidentManagementImage from "assets/svg/upgrade/audit-logs/incident-management.svg";
import SecurityAndComplianceImage from "assets/svg/upgrade/audit-logs/security-and-compliance.svg";
import AnalyticsUtil from "../../../utils/AnalyticsUtil";
import { getAppsmithConfigs } from "../../configs";
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
  UPGRADE,
} from "../../constants/messages";

const { intercomAppID } = getAppsmithConfigs();

export function AuditLogsUpgradePage() {
  const header: Header = {
    heading: createMessage(INTRODUCING, createMessage(AUDIT_LOGS)),
    subHeadings: [createMessage(AUDIT_LOGS_UPGRADE_PAGE_SUB_HEADING)],
  };
  const carousel = {
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
  };

  const footer = {
    onClick: () => {
      AnalyticsUtil.logEvent("ADMIN_SETTINGS_UPGRADE_HOOK", {
        source: "AuditLogs",
      });
      if (intercomAppID && window.Intercom) {
        window.Intercom("showNewMessage", createMessage(UPGRADE));
      }
    },
    message: createMessage(EXCLUSIVE_TO_BUSINESS, ["audit logs"]),
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
