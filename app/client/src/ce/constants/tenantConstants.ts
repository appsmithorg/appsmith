export const tenantConfigConnection: string[] = [
  "instanceName",
  "googleMapsKey",
  "emailVerificationEnabled",
  "singleSessionPerUserEnabled",
  "showRolesAndGroups",
  "hideWatermark",
];

export const RESTART_POLL_TIMEOUT = 2 * 150 * 1000;
export const RESTART_POLL_INTERVAL = 2000;

export enum MIGRATION_STATUS {
  COMPLETED = "COMPLETED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
}
