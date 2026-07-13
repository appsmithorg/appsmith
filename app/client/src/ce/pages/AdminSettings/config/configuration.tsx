import React from "react";
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
import { TagInput } from "@appsmith/ads-old";
import localStorage from "utils/localStorage";
import isUndefined from "lodash/isUndefined";
import { AppsmithFrameAncestorsSetting } from "pages/Applications/EmbedSnippet/Constants/constants";
import { formatEmbedSettings } from "pages/Applications/EmbedSnippet/Utils/utils";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { APPSMITH_BASE_URL_SETUP_DOC } from "constants/ThirdPartyConstants";

const isAirgappedInstance = isAirgapped();

export const APPSMITH_DB_URL: Setting = {
  id: "APPSMITH_DB_URL",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Appsmith DB URL",
  subText:
    "* Persistence database URL for Appsmith instance. Change this to an external database for clustering",
};

export const APPSMITH_REDIS_URL: Setting = {
  id: "APPSMITH_REDIS_URL",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Redis URL",
  subText:
    "* Appsmith internally uses Redis for session storage. Change this to an external redis for clustering",
};

export const APPSMITH_BASE_URL: Setting = {
  id: "APPSMITH_BASE_URL",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Appsmith Base URL",
  helpText: "Learn more about configuring Appsmith Base URL.",
  helpTextLink: APPSMITH_BASE_URL_SETUP_DOC,
  subText:
    "* The base URL where Appsmith is accessible. This is required for password reset and email verification links to work correctly.",
  placeholder: "https://appsmith.example.com",
  validate: (value: string) => {
    if (!value || value.trim() === "") {
      return "This field cannot be empty";
    }

    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      return "Base URL must start with http:// or https://";
    }
  },
};

export const APPSMITH_POOL_SIZE_CONFIG: Setting = {
  id: "connectionMaxPoolSize",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.NUMBER,
  isFeatureEnabled: false,
  isDisabled: () => true,
  isEnterprise: true,
  label: "Connection pool size",
  subText: "You can establish a maximum of 5 to 50 connections.",
  placeholder: "12",
  validate: (value: string) => {
    if (parseInt(value) > 50) {
      return "Please enter valid pool size less than or equal to 50.";
    } else if (parseInt(value) < 5) {
      return "Please enter valid pool size more than or equal to 5.";
    }
  },
  isVisible: () => !isAirgappedInstance,
};

export const APPSMITH_MCP_ENABLED_SETTING: Setting = {
  id: "APPSMITH_MCP_ENABLED",
  name: "APPSMITH_MCP_ENABLED",
  category: SettingCategories.CONFIGURATION,
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
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.CHECKBOX,
  label: "MCP data tools",
  text: "Let agents work with datasources and queries (create datasources/queries, run read-only actions)",
  subText:
    "* Off by default. All operations run under the connecting user's existing permissions; credentials are never exposed to agents.",
};

export const APPSMITH_MCP_JS_ENABLED_SETTING: Setting = {
  id: "APPSMITH_MCP_JS_ENABLED",
  name: "APPSMITH_MCP_JS_ENABLED",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.CHECKBOX,
  label: "MCP JS objects",
  text: "Let agents author restricted JS objects (declarative grammar only — no arbitrary JavaScript)",
  subText: "* Off by default. Requires MCP data tools.",
};

export const APPSMITH_MCP_TOKEN_TTL_DAYS_SETTING: Setting = {
  id: "APPSMITH_MCP_TOKEN_TTL_DAYS",
  name: "APPSMITH_MCP_TOKEN_TTL_DAYS",
  category: SettingCategories.CONFIGURATION,
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

export const APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING: Setting = {
  id: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  name: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.RADIO,
  label: "Embed settings",
  controlTypeProps: {
    options: [
      {
        badge: "Not recommended",
        tooltip: {
          icon: "question-line",
          text: "Lets all domains, including malicious ones, embed your Appsmith apps. ",
          linkText: "Find out why it's risky",
          link: "https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this",
        },
        label: "Allow embedding everywhere",
        value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
      },
      {
        label: "Limit embedding to certain URLs",
        value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
        nodeLabel: "You can add one or more URLs",
        node: <TagInput input={{}} placeholder={""} type={"text"} />,
        nodeInputPath: "input",
        nodeParentClass: "tag-input",
      },
      {
        label: "Disable embedding everywhere",
        value: AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE,
      },
    ],
  },
  format: formatEmbedSettings,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse: (value: { value: string; additionalData?: any }) => {
    // Retrieve values from local storage while switching to limit by url option
    const sources = isUndefined(value.additionalData)
      ? localStorage.getItem("ALLOWED_FRAME_ANCESTORS") ?? ""
      : value.additionalData.replaceAll(",", " ");

    // If they are one of the other options we don't store it in storage since it will
    // set in the env variable on save
    if (sources !== "*" && sources !== "'none'") {
      localStorage.setItem("ALLOWED_FRAME_ANCESTORS", sources);
    }

    if (
      value.value === AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE
    ) {
      return "*";
    } else if (
      value.value === AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE
    ) {
      return "'none'";
    } else {
      return sources;
    }
  },
  validate: (value: string) => {
    if (!value) {
      return "This field cannot be empty";
    }
  },
};

export const config: AdminConfigType = {
  icon: "equalizer-line",
  type: SettingCategories.CONFIGURATION,
  categoryType: CategoryType.INSTANCE,
  controlType: SettingTypes.GROUP,
  title: "Configuration",
  canSave: true,
  settings: [
    APPSMITH_DB_URL,
    APPSMITH_REDIS_URL,
    APPSMITH_BASE_URL,
    APPSMITH_POOL_SIZE_CONFIG,
    APPSMITH_MCP_ENABLED_SETTING,
    APPSMITH_MCP_DATA_ENABLED_SETTING,
    APPSMITH_MCP_JS_ENABLED_SETTING,
    APPSMITH_MCP_TOKEN_TTL_DAYS_SETTING,
    APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
  ],
};
