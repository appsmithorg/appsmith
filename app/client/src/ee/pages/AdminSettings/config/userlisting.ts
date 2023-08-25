export * from "ce/pages/AdminSettings/config/userlisting";
import { config as CE_config } from "ce/pages/AdminSettings/config/userlisting";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import { UserListing } from "../AccessControl/UserListing";

export const config: AdminConfigType = {
  ...CE_config,
  type: SettingCategories.USER_LISTING,
  component: UserListing,
  title: "Users",
  isFeatureEnabled: true,
} as AdminConfigType;
