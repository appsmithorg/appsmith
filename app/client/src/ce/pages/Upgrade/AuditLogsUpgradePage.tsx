import React from "react";
import { Header } from "./types";
import UpgradePage from "./UpgradePage";
import DebuggingImage from "assets/svg/upgrade/audit-logs/debugging.svg";
import IncidentManagementImage from "assets/svg/upgrade/audit-logs/incident-management.svg";
import SecurityAndComplianceImage from "assets/svg/upgrade/audit-logs/security-and-compliance.svg";
import AnalyticsUtil from "../../../utils/AnalyticsUtil";
import { getAppsmithConfigs } from "../../configs";
import { createMessage, UPGRADE } from "../../constants/messages";

const { intercomAppID } = getAppsmithConfigs();

export function AuditLogsUpgradePage() {
  const header: Header = {
    heading: "Audit Logs",
    subHeadings: [
      "Your workspace audit log gives Workspace owners access to detailed information about security and safety-related activity.",
    ],
  };
  const carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: "Security & Compliance",
        details: [
          "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.",
        ],
      },
      {
        icon: "search-eye-line",
        heading: "Debugging",
        details: [
          "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.",
        ],
      },
      {
        icon: "alert-line",
        heading: "Incident management",
        details: [
          "Debug with a timeline of events filtered by user and resource ID, correlate them with end-user and app developer actions, and investigate back to the last known good state of your app.",
        ],
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
    message:
      "The audit log feature is exclusive to workspaces on the Enterprise Plan",
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
