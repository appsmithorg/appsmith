// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { AuditLogsUpgradePage } from "ce/pages/Upgrade/AuditLogsUpgradePage";
import AuditLogsFeatureContainer from "@appsmith/pages/AuditLogs";

export const getAuditLogsComponent = (isEnabled: boolean) => {
  if (isEnabled) {
    return AuditLogsFeatureContainer;
  } else return AuditLogsUpgradePage;
};
