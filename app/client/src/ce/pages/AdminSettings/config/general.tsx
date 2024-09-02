import React from "react";
import { isEmail } from "utils/formhelpers";
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
import BrandingBadge from "pages/AppViewer/BrandingBadge";
import { TagInput } from "@appsmith/ads-old";
import localStorage from "utils/localStorage";
import isUndefined from "lodash/isUndefined";
import { AppsmithFrameAncestorsSetting } from "pages/Applications/EmbedSnippet/Constants/constants";
import { formatEmbedSettings } from "pages/Applications/EmbedSnippet/Utils/utils";

export const APPSMITH_INSTANCE_NAME_SETTING_SETTING: Setting = {
  id: "instanceName",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Instance name",
  placeholder: "appsmith/prod",
};

export const APPSMITH_ADMIN_EMAILS_SETTING: Setting = {
  id: "APPSMITH_ADMIN_EMAILS",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TAGINPUT,
  controlSubType: SettingSubtype.EMAIL,
  label: "Admin email",
  subText: "* Emails of the users who can modify instance settings",
  placeholder: "Jane@example.com",
  validate: (value: string) => {
    if (
      value &&
      !value
        .split(",")
        .reduce((prev, curr) => prev && isEmail(curr.trim()), true)
    ) {
      return "Please enter valid email id(s)";
    }
  },
};

export const APPSMITH_DISABLE_TELEMETRY_SETTING: Setting = {
  id: "APPSMITH_DISABLE_TELEMETRY",
  name: "APPSMITH_DISABLE_TELEMETRY",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Anonymous usage data",
  text: "Share anonymous usage data to help improve the product",
};

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  id: "hideWatermark",
  name: "hideWatermark",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Appsmith watermark",
  text: "Hide Appsmith watermark",
  isFeatureEnabled: false,
  isDisabled: () => true,
  textSuffix: <BrandingBadge />,
};

export const APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING: Setting = {
  id: "showRolesAndGroups",
  name: "showRolesAndGroups",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Programmatic access control",
  text: "Access roles and user groups in code for conditional business logic",
  isFeatureEnabled: false,
  isDisabled: () => true,
};

export const APPSMITH_SINGLE_USER_PER_SESSION_SETTING: Setting = {
  id: "singleSessionPerUserEnabled",
  name: "singleSessionPerUserEnabled",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "User session limit",
  text: "Limit users to a single active session",
  isFeatureEnabled: false,
  isDisabled: () => true,
};

export const APPSMITH_USER_SESSION_TIMEOUT_SETTING: Setting = {
  id: "userSessionTimeoutInMinutes",
  name: "userSessionTimeoutInMinutes",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TEXTINPUT,
  label: "Session Timeout",
  subText:
    "* Default duration is 30 days. To change, enter the new duration in DD:HH:MM format",
  helpText:
    "Users' session will automatically end if there's no activity for the specified duration, requiring them to log in again for security. The duration can be set between 1 minute and 30 days.",
  isFeatureEnabled: false,
  isEnterprise: true,
  isDisabled: () => true,
};

export const APPSMITH_IS_ATOMIC_PUSH_ALLOWED: Setting = {
  id: "isAtomicPushAllowed",
  name: "isAtomicPushAllowed",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Allow atomic pushes",
  text: "Git operations on this tenant should attempt to perform pushes atomically",
};

export const APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING: Setting = {
  id: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  name: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  category: SettingCategories.GENERAL,
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
  icon: "settings-2-line",
  type: SettingCategories.GENERAL,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "General",
  canSave: true,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH_ADMIN_EMAILS_SETTING,
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
    APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
    APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
    APPSMITH_USER_SESSION_TIMEOUT_SETTING,
    APPSMITH_IS_ATOMIC_PUSH_ALLOWED,
    APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
  ],
} as AdminConfigType;
