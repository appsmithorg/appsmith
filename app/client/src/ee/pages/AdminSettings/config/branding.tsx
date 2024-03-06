export * from "ce/pages/AdminSettings/config/branding";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import { config as config_CE } from "ce/pages/AdminSettings/config/branding";

export const config: AdminConfigType = {
  ...config_CE,
};
