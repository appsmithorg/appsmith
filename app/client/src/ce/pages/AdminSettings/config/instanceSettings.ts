import { isAirgapped } from "ee/utils/airgapHelpers";
import { GOOGLE_MAPS_SETUP_DOC } from "constants/ThirdPartyConstants";
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
import { isEmail } from "utils/formhelpers";

const isAirgappedInstance = isAirgapped();

export const APPSMITH_INSTANCE_NAME_SETTING_SETTING: Setting = {
  id: "instanceName",
  category: SettingCategories.INSTANCE_SETTINGS,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Instance name",
  placeholder: "appsmith/prod",
};

export const APPSMITH_ADMIN_EMAILS_SETTING: Setting = {
  id: "APPSMITH_ADMIN_EMAILS",
  category: SettingCategories.INSTANCE_SETTINGS,
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

export const APPSMITH_GOOGLE_MAPS_CONFIG: Setting = {
  id: "googleMapsKey",
  category: SettingCategories.INSTANCE_SETTINGS,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Google Maps API key",
  subText: "How to configure google maps?",
  subTextLink: GOOGLE_MAPS_SETUP_DOC,
  isVisible: () => !isAirgappedInstance,
};

export const APPSMITH_CUSTOM_DOMAINS: Setting = {
  id: "APPSMITH_CUSTOM_DOMAIN",
  category: SettingCategories.INSTANCE_SETTINGS,
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Custom domain",
  subText:
    "* Custom domain for your Appsmith instance. Enter the domain only, without http:// or https://.",
  placeholder: "apps.example.com",
  // The server stores the value without checking it. Caddy ignores the whole value if it starts with http:// or
  // https://, so the instance silently runs without the custom domain. A path or a space breaks the site address.
  // The value is saved as typed, so a leading or trailing space is refused, not trimmed.
  validate: (value: string) => {
    if (!value?.trim()) return;

    if (value.includes("://")) {
      return "Remove http:// or https://. Enter the domain only, for example apps.example.com";
    }

    if (/[/\s]/.test(value)) {
      return "Enter the domain only, without a path or spaces. For example, apps.example.com";
    }
  },
};

export const APPSMITH_IS_ATOMIC_PUSH_ALLOWED: Setting = {
  id: "isAtomicPushAllowed",
  name: "isAtomicPushAllowed",
  category: SettingCategories.INSTANCE_SETTINGS,
  controlType: SettingTypes.CHECKBOX,
  label: "Allow atomic pushes",
  text: "Git operations on this organization should attempt to perform pushes atomically",
};

export const config: AdminConfigType = {
  icon: "settings-line",
  type: SettingCategories.INSTANCE_SETTINGS,
  categoryType: CategoryType.INSTANCE,
  controlType: SettingTypes.GROUP,
  title: "Instance settings",
  canSave: true,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH_ADMIN_EMAILS_SETTING,
    APPSMITH_GOOGLE_MAPS_CONFIG,
    APPSMITH_CUSTOM_DOMAINS,
    APPSMITH_IS_ATOMIC_PUSH_ALLOWED,
  ],
};
