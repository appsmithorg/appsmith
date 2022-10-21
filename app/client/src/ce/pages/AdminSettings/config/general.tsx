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
import { TagInput } from "design-system";
import QuestionFillIcon from "remixicon-react/QuestionFillIcon";
import localStorage from "utils/localStorage";
import isUndefined from "lodash/isUndefined";

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

export const APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING: Setting = {
  id: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  name: "APPSMITH_ALLOWED_FRAME_ANCESTORS",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.RADIO,
  label: "Embed Settings",
  controlTypeProps: {
    options: [
      {
        badge: "NOT RECOMMENDED",
        tooltip: {
          icon: <QuestionFillIcon />,
          text:
            "Lets all domains, including malicious ones, embed your Appsmith apps. ",
          linkText: "SEE WHY THIS IS RISKY",
          link:
            "https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this",
        },
        label: "Allow embedding everywhere",
        value: "ALLOW_EMBEDDING_EVERYWHERE",
      },
      {
        label: "Limit embedding to certain URLs",
        value: "LIMIT_EMBEDDING",
        nodeLabel: "You can add one or more URLs",
        node: <TagInput input={{}} placeholder={""} type={"text"} />,
        nodeInputPath: "input",
        nodeParentClass: "tag-input",
      },
      {
        label: "Disable embedding everywhere",
        value: "DISABLE_EMBEDDING_EVERYWHERE",
      },
    ],
  },
  format: (value: string) => {
    if (value === "*") {
      return {
        value: "ALLOW_EMBEDDING_EVERYWHERE",
      };
    } else if (value === "'none'") {
      return {
        value: "DISABLE_EMBEDDING_EVERYWHERE",
      };
    } else {
      return {
        value: "LIMIT_EMBEDDING",
        additionalData: value ? value.replaceAll(" ", ",") : "",
      };
    }
  },
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

    if (value.value === "ALLOW_EMBEDDING_EVERYWHERE") {
      return "*";
    } else if (value.value === "DISABLE_EMBEDDING_EVERYWHERE") {
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
  controlType: SettingTypes.GROUP,
  title: "General",
  canSave: true,
  settings: [
    APPSMITH_INSTANCE_NAME_SETTING_SETTING,
    APPSMITH__ADMIN_EMAILS_SETTING,
    APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE_SETTING,
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
    APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING,
  ],
} as AdminConfigType;
