import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";

export const APPSMITH_MCP_ENABLED_SETTING: Setting = {
  id: "APPSMITH_MCP_ENABLED",
  name: "APPSMITH_MCP_ENABLED",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.CHECKBOX,
  label: "MCP server",
  text: "Allow AI agents to connect to this instance over MCP (Model Context Protocol)",
  subText:
    "* Agents authenticate with per-user MCP tokens (Profile → MCP tokens) and act with that user's permissions. Enabled by default; disabling removes the /mcp endpoint and rejects MCP tokens on restart.",
  defaultValue: true,
};

export const APPSMITH_MCP_DATA_ENABLED_SETTING: Setting = {
  id: "APPSMITH_MCP_DATA_ENABLED",
  name: "APPSMITH_MCP_DATA_ENABLED",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.CHECKBOX,
  label: "MCP data tools",
  text: "Let agents work with datasources and queries (create datasources/queries, run read-only actions)",
  subText:
    "* Enabled by default. All operations run under the connecting user's existing permissions; credentials are never exposed to agents.",
  defaultValue: true,
};

export const APPSMITH_MCP_JS_ENABLED_SETTING: Setting = {
  id: "APPSMITH_MCP_JS_ENABLED",
  name: "APPSMITH_MCP_JS_ENABLED",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.CHECKBOX,
  label: "MCP JS objects",
  text: "Let agents author restricted JS objects (declarative grammar only — no arbitrary JavaScript)",
  subText: "* Enabled by default. Requires MCP data tools.",
  defaultValue: true,
};

export const APPSMITH_MCP_TOKEN_TTL_DAYS_SETTING: Setting = {
  id: "APPSMITH_MCP_TOKEN_TTL_DAYS",
  name: "APPSMITH_MCP_TOKEN_TTL_DAYS",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.NUMBER,
  label: "MCP token lifetime (days)",
  subText:
    "* How long a newly created or rotated MCP token stays valid. Defaults to 90 days; must be between 1 and 3650.",
  placeholder: "90",
  validate: (value: string) => {
    if (value === undefined || value === "") {
      return;
    }

    const days = Number(value);

    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return "Please enter a whole number of days between 1 and 3650.";
    }
  },
};

export const config: AdminConfigType = {
  icon: "robot-2",
  type: SettingCategories.MCP_SERVER,
  categoryType: CategoryType.INSTANCE,
  controlType: SettingTypes.GROUP,
  title: "MCP Server (BETA)",
  canSave: true,
  settings: [
    APPSMITH_MCP_ENABLED_SETTING,
    APPSMITH_MCP_DATA_ENABLED_SETTING,
    APPSMITH_MCP_JS_ENABLED_SETTING,
    APPSMITH_MCP_TOKEN_TTL_DAYS_SETTING,
  ],
};
