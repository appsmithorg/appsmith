export * from "ce/constants/tenantConstants";
import { tenantConfigConnection as CE_tenantConfigConnection } from "ce/constants/tenantConstants";

export const tenantConfigConnection: string[] = [
  ...CE_tenantConfigConnection,
  "showRolesAndGroups",
  "singleSessionPerUserEnabled",
];

export const RESTART_POLL_TIMEOUT = 2 * 150 * 1000;
