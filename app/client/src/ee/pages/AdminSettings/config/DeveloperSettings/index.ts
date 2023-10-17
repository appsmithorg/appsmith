import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import { config as CE_config } from "ce/pages/AdminSettings/config/DeveloperSettings";
import { poolSizeConfig } from "./poolSize";

export const config: AdminConfigType = {
  ...CE_config,
  settings: [...(CE_config.settings || []), ...poolSizeConfig],
};
