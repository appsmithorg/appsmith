import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
  SettingSubtype,
} from "ee/pages/AdminSettings/config/types";
import { getDefaultMcpServerUrl } from "ee/constants/mcp";
import McpKeysPage from "pages/AdminSettings/Profile/McpKeysPage";

const isMcpServerOff = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: Record<string, any>,
) =>
  values?.mcpConfig?.enabled !== true && values?.["mcpConfig.enabled"] !== true;

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

export const MCP_DATA_ENABLED_SETTING: Setting = {
  id: "mcpConfig.dataEnabled",
  name: "mcpConfig.dataEnabled",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.TOGGLE,
  label: "MCP data tools",
  text: "Let agents work with datasources and queries (create datasources/queries, run read-only actions)",
  helpText:
    "* Disabled by default. Requires the MCP server above. All operations run under the connecting user's existing permissions; credentials are never exposed to agents.",
  defaultValue: false,
  isDisabled: isMcpServerOff,
};

export const MCP_SERVER_URL_SETTING: Setting = {
  id: "mcpConfig.serverUrl",
  name: "mcpConfig.serverUrl",
  category: SettingCategories.MCP_SERVER,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "MCP server URL",
  subText: "MCP server URL which MCP clients should use to reach this instance",
  placeholder: getDefaultMcpServerUrl(),
  helpText:
    "* URL MCP clients should use to reach this instance. Leave blank to use the default (this origin + /mcp). Set a custom value if Appsmith is behind a reverse proxy or a different public hostname.",
  isDisabled: isMcpServerOff,

  validate: (value: string) => {
    if (value === undefined || value === "") {
      return;
    }

    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "Enter an http(s) URL.";
      }
    } catch {
      return "Enter a valid URL.";
    }
  },
};

const instanceSettings = [
  MCP_ENABLED_SETTING,
  MCP_DATA_ENABLED_SETTING,
  MCP_SERVER_URL_SETTING,
];

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
  settings: [MCP_ENABLED_SETTING, MCP_DATA_ENABLED_SETTING],
};

export const getMcpServerConfig = (
  isMultiOrgEnabled: boolean,
): AdminConfigType => {
  return isMultiOrgEnabled
    ? { ...config, settings: [MCP_ENABLED_SETTING] }
    : {
        ...config,
        categoryType: CategoryType.INSTANCE,
        settings: instanceSettings,
      };
};
