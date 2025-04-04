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
};

export const APPSMITH_IS_CROSS_SITE_EMBEDDING_ENABLED: Setting = {
  id: "isCrossSiteEmbeddingEnabled",
  name: "isCrossSiteEmbeddingEnabled",
  category: SettingCategories.CONFIGURATION,
  controlType: SettingTypes.CHECKBOX,
  label: "Private embeds",
  text: "Enable embedding of private Appsmith apps on external domains beyond the current domain",
  tooltip:
    "Users will need to log out and log in again to be able to use embeds across domains",
  isFeatureEnabled: false,
  isDisabled: () => true,
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
    APPSMITH_POOL_SIZE_CONFIG,
    APPSMITH_IS_CROSS_SITE_EMBEDDING_ENABLED,
    APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
  ],
};
