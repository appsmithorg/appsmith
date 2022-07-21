import { isEmail } from "utils/formhelpers";
import { apiRequestConfig } from "api/Api";
import UserApi from "@appsmith/api/UserApi";
import {
  AdminConfigType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export const config: AdminConfigType = {
  type: SettingCategories.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "General",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_INSTANCE_NAME",
      category: SettingCategories.GENERAL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Instance Name",
      placeholder: "appsmith/prod",
    },
    {
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
    },
    {
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
    },
    {
      id: "APPSMITH_DISABLE_TELEMETRY",
      category: SettingCategories.GENERAL,
      controlType: SettingTypes.TOGGLE,
      label: "Share anonymous usage data",
      subText: "Share anonymous usage data to help improve the product",
      toggleText: (value: boolean) =>
        value ? "Don't share any data" : "Share Anonymous Telemetry",
    },
  ],
} as AdminConfigType;
