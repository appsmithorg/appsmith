import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import McpKeysPage from "pages/AdminSettings/Profile/McpKeysPage";

export const MCP_ENABLED_SETTING: Setting = {
  id: "mcpConfig.enabled",
  name: "mcpConfig.enabled",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.TOGGLE,
  label: "Enable MCP server",
  text: "Allow AI agents to connect to this organization over MCP (Model Context Protocol)",
  helpText:
    "* Agents authenticate with per-user MCP keys (Settings → MCP Keys) and act with that user's permissions. Disabled by default — turning this on exposes the /mcp endpoint and lets users create MCP keys. Turning it off removes the endpoint, blocks new keys, and rejects existing ones.",
  defaultValue: false,
};

export const mcpKeys: AdminConfigType = {
  icon: "robot-2",
  type: SettingCategories.MCP_KEYS,
  categoryType: CategoryType.PROFILE,
  controlType: SettingTypes.PAGE,
  component: McpKeysPage,
  title: "MCP keys",
  canSave: false,
} as AdminConfigType;

export const config: AdminConfigType = {
  icon: "robot-2",
  type: SettingCategories.MCP_SERVER,
  categoryType: CategoryType.ORGANIZATION,
  controlType: SettingTypes.GROUP,
  title: "MCP Server (BETA)",
  canSave: true,
  settings: [MCP_ENABLED_SETTING],
};

export const getMcpServerConfig = (
  isMultiOrgEnabled: boolean,
): AdminConfigType => {
  return isMultiOrgEnabled
    ? config
    : {
        ...config,
        categoryType: CategoryType.INSTANCE,
        needsRestart: true,
      };
};
