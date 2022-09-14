import React from "react";
import { isEmail } from "utils/formhelpers";
import { apiRequestConfig } from "api/Api";
import UserApi from "@appsmith/api/UserApi";
import {
  AdminConfigType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
  Setting,
} from "@appsmith/pages/AdminSettings/config/types";
import BrandingBadge from "pages/AppViewer/BrandingBadge";

export const APPSMITH_INSTANCE_NAME_SETTING_SETTING: Setting = {
  id: "APPSMITH_INSTANCE_NAME",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Instance Name",
  placeholder: "appsmith/prod",
};

export const APPSMITH__ADMIN_EMAILS_SETTING: Setting = {
  id: "APPSMITH_ADMIN_EMAILS",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.EMAIL,
  label: "Admin Email",
  subText:
    "Emails of the users who can modify instance settings (Comma Separated)",
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

export const APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING: Setting = {
  id: "APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE",
  action: () => {
    const { host, protocol } = window.location;
    window.open(
      `${protocol}//${host}${apiRequestConfig.baseURL}${UserApi.downloadConfigURL}`,
      "_blank",
    );
  },
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.BUTTON,
  label: "Generated Docker Compose File",
  text: "Download",
};

export const APPSMITH_DISABLE_TELEMETRY_SETTING: Setting = {
  id: "APPSMITH_DISABLE_TELEMETRY",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.TOGGLE,
  label: "Share anonymous usage data",
  subText: "Share anonymous usage data to help improve the product",
  toggleText: (value: boolean) =>
    value ? "Don't share any data" : "Share Anonymous Telemetry",
};

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  id: "APPSMITH_HIDE_WATERMARK",
  name: "APPSMITH_HIDE_WATERMARK",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Appsmith Watermark",
  text: "Show Appsmith Watermark",
  needsUpgrade: true,
  isDisabled: () => true,
  textSuffix: <BrandingBadge />,
  upgradeLogEventName: "ADMIN_SETTINGS_UPGRADE_WATERMARK",
  upgradeIntercomMessage:
    "Hello, I would like to upgrade and remove the watermark.",
};

export const config: AdminConfigType = {
  type: SettingCategories.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "General",
  canSave: true,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH__ADMIN_EMAILS_SETTING,
    APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
  ],
} as AdminConfigType;
