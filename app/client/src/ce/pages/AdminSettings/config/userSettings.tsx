import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";

export const APPSMITH_SINGLE_USER_PER_SESSION_SETTING: Setting = {
  id: "singleSessionPerUserEnabled",
  name: "singleSessionPerUserEnabled",
  category: SettingCategories.USER_SETTINGS,
  controlType: SettingTypes.CHECKBOX,
  label: "User session limit",
  text: "Limit users to a single active session",
  isFeatureEnabled: false,
  isDisabled: () => true,
};

export const APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING: Setting = {
  id: "showRolesAndGroups",
  name: "showRolesAndGroups",
  category: SettingCategories.USER_SETTINGS,
  controlType: SettingTypes.CHECKBOX,
  label: "Programmatic access control",
  text: "Access roles and user groups in code for conditional business logic",
  isFeatureEnabled: false,
  isDisabled: () => true,
};

export const APPSMITH_USER_SESSION_TIMEOUT_SETTING: Setting = {
  id: "userSessionTimeoutInMinutes",
  name: "userSessionTimeoutInMinutes",
  category: SettingCategories.USER_SETTINGS,
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

export const config: AdminConfigType = {
  type: SettingCategories.USER_SETTINGS,
  categoryType: CategoryType.USER_MANAGEMENT,
  controlType: SettingTypes.GROUP,
  canSave: true,
  title: "User settings",
  icon: "user-settings-line",
  settings: [
    APPSMITH_SINGLE_USER_PER_SESSION_SETTING,
    APPSMITH_SHOW_ROLES_AND_GROUPS_SETTING,
    APPSMITH_USER_SESSION_TIMEOUT_SETTING,
  ],
};
