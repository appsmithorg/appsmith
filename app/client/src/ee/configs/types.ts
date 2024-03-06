export * from "ce/configs/types";
import type { AppsmithUIConfigs as CE_AppsmithUIConfigs } from "ce/configs/types";

export interface AppsmithUIConfigs extends CE_AppsmithUIConfigs {
  enableAuditLogs: boolean;
  airGapped: boolean;
}
