import { apiRequestConfig } from "api/Api";
import UserApi from "api/UserApi";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  EMAIL_SETUP_DOC,
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_MAPS_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
} from "constants/ThirdPartyConstants";
import { Dispatch } from "react";
import { isEmail } from "utils/formhelpers";

export enum SettingTypes {
  TEXTINPUT = "TEXTINPUT",
  TOGGLE = "TOGGLE",
  LINK = "LINK",
  BUTTON = "BUTTON",
  GROUP = "GROUP",
  TEXT = "TEXT",
}

export enum SettingSubtype {
  EMAIL = "email",
  TEXT = "text",
  NUMBER = "number",
  PASSWORD = "password",
}

export type Setting = {
  category: string;
  controlType: SettingTypes;
  controlSubType?: SettingSubtype;
  helpText?: string;
  label?: string;
  name?: string;
  placeholder?: string;
  validate?: (value: string, setting?: Setting) => string | void;
  url?: string;
  children?: any;
  subCategory?: string;
  value?: string;
  text?: string;
  action?: (dispatch?: Dispatch<ReduxAction<any>>) => void;
  sortOrder?: number;
  subText?: string;
  toggleText?: (value: boolean) => string;
  isVisible?: (values: Record<string, any>) => boolean;
  isHidden?: boolean;
};

export class SettingsFactory {
  static settingsMap: Record<string, Setting> = {};
  static settings: Setting[] = [];
  static categories: Set<string> = new Set();
  static savableCategories: Set<string> = new Set();
  static sortOrder = 0;
  static subCategoryMap: Record<any, any> = {};

  static register(name: string, options: Setting) {
    SettingsFactory.categories.add(options.category);
    SettingsFactory.settingsMap[name] = {
      ...options,
      sortOrder: ++SettingsFactory.sortOrder,
    };
    if (
      options.controlType !== SettingTypes.GROUP &&
      options.controlType !== SettingTypes.LINK &&
      options.controlType !== SettingTypes.TEXT
    ) {
      SettingsFactory.savableCategories.add(options.category);
    }

    if (options.subCategory) {
      if (
        !SettingsFactory.subCategoryMap[
          `${options.category}.${options.subCategory}`
        ]
      ) {
        SettingsFactory.subCategoryMap[
          `${options.category}.${options.subCategory}`
        ] = {
          name: options.subCategory,
          category: options.category,
          controlType: SettingTypes.GROUP,
          children: [],
        };
        SettingsFactory.settings.push(
          SettingsFactory.subCategoryMap[
            `${options.category}.${options.subCategory}`
          ],
        );
      }
      SettingsFactory.subCategoryMap[
        `${options.category}.${options.subCategory}`
      ].children.push({
        name,
        ...options,
      });
    } else {
      SettingsFactory.settings.push({
        name,
        ...options,
      });
    }
  }

  static validate(name: string, value: string) {
    const setting = SettingsFactory.settingsMap[name];
    if (setting?.validate) {
      return setting.validate(value, setting);
    }

    return "";
  }

  static get(category: string) {
    SettingsFactory.settings.forEach((setting) => {
      setting.isHidden = setting.category !== category;
    });

    return SettingsFactory.settings;
  }
}

//EMAIL
SettingsFactory.register("APPSMITH_MAIL_READ_MORE", {
  category: "email",
  controlType: SettingTypes.LINK,
  label: "How to configure?",
  url: EMAIL_SETUP_DOC,
});

SettingsFactory.register("APPSMITH_MAIL_HOST", {
  category: "email",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "SMTP Host",
  placeholder: "email-smtp.us-east-2.amazonaws.com",
});

SettingsFactory.register("APPSMITH_MAIL_PORT", {
  category: "email",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.NUMBER,
  placeholder: "25",
  label: "SMTP Port",
  validate: (value: string) => {
    const port = parseInt(value);
    if (value && (typeof port != "number" || port < 0 || port > 65535)) {
      return "Please enter a valid port";
    }
  },
});

SettingsFactory.register("APPSMITH_MAIL_FROM", {
  category: "email",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "From Address",
  placeholder: "admin@appsmith.com",
  validate: (value: string) => {
    if (value && !isEmail(value)) {
      return "Please enter a valid email id";
    }
  },
  subText:
    "You will need to verify your from email address to begin sending emails",
});

SettingsFactory.register("APPSMITH_MAIL_SMTP_TLS_ENABLED", {
  category: "email",
  controlType: SettingTypes.TOGGLE,
  label: "TLS Protected Connection",
});

SettingsFactory.register("APPSMITH_MAIL_USERNAME", {
  category: "email",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "SMTP Username",
  isVisible: (values: Record<string, any>) => {
    return values && values["APPSMITH_MAIL_SMTP_TLS_ENABLED"];
  },
});

SettingsFactory.register("APPSMITH_MAIL_PASSWORD", {
  category: "email",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.PASSWORD,
  label: "SMTP Password",
  isVisible: (values: Record<string, any>) => {
    return values && values["APPSMITH_MAIL_SMTP_TLS_ENABLED"];
  },
});

SettingsFactory.register("APPSMITH_MAIL_TEST_EMAIL", {
  action: (dispatch) => {
    dispatch &&
      dispatch({
        type: ReduxActionTypes.SEND_TEST_EMAIL,
        payload: true,
      });
  },
  category: "email",
  controlType: SettingTypes.BUTTON,
  isVisible: (values: Record<string, any>) => {
    return (
      values && values["APPSMITH_MAIL_HOST"] && values["APPSMITH_MAIL_FROM"]
    );
  },
  text: "Send Test Email",
});

//General
SettingsFactory.register("APPSMITH_INSTANCE_NAME", {
  category: "general",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Instance Name",
  placeholder: "appsmith/prod",
});

SettingsFactory.register("APPSMITH_ADMIN_EMAILS", {
  category: "general",
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
});

SettingsFactory.register("APPSMITH_DOWNLOAD_DOCKER_COMPOSE_FILE", {
  action: () => {
    const { host, protocol } = window.location;
    window.open(
      `${protocol}//${host}${apiRequestConfig.baseURL}${UserApi.downloadConfigURL}`,
      "_blank",
    );
  },
  category: "general",
  controlType: SettingTypes.BUTTON,
  label: "Generated Docker Compose File",
  text: "Download",
});

SettingsFactory.register("APPSMITH_DISABLE_TELEMETRY", {
  category: "general",
  controlType: SettingTypes.TOGGLE,
  label: "Disable Sharing Anonymous Usage Data",
  subText: "Share anonymous usage data to help improve the product",
  toggleText: (value: boolean) => {
    if (value) {
      return "Don't share any data";
    } else {
      return "Share data & make appsmith better!";
    }
  },
});

//goolge maps
SettingsFactory.register("APPSMITH_GOOGLE_MAPS_READ_MORE", {
  category: "google-maps",
  controlType: SettingTypes.LINK,
  label: "How to configure?",
  url: GOOGLE_MAPS_SETUP_DOC,
});

SettingsFactory.register("APPSMITH_GOOGLE_MAPS_API_KEY", {
  category: "google-maps",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Google Maps API Key",
});

//authentication
SettingsFactory.register("APPSMITH_SIGNUP_DISABLED", {
  category: "authentication",
  subCategory: "form signup",
  controlType: SettingTypes.TOGGLE,
  label: "Signup",
  toggleText: (value: boolean) => {
    if (value) {
      return "Allow invited users to signup";
    } else {
      return " Allow all users to signup";
    }
  },
});

SettingsFactory.register("APPSMITH_OAUTH2_GOOGLE_READ_MORE", {
  category: "authentication",
  subCategory: "google signup",
  controlType: SettingTypes.LINK,
  label: "How to configure?",
  url: GOOGLE_SIGNUP_SETUP_DOC,
});

SettingsFactory.register("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID", {
  category: "authentication",
  subCategory: "google signup",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Client ID",
});

SettingsFactory.register("APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET", {
  category: "authentication",
  subCategory: "google signup",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Client Secret",
});

SettingsFactory.register("APPSMITH_SIGNUP_ALLOWED_DOMAINS", {
  category: "authentication",
  subCategory: "google signup",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Allowed Domains",
  placeholder: "domain1.com, domain2.com",
});

SettingsFactory.register("APPSMITH_OAUTH2_GITHUB_READ_MORE", {
  category: "authentication",
  subCategory: "github signup",
  controlType: SettingTypes.LINK,
  label: "How to configure?",
  url: GITHUB_SIGNUP_SETUP_DOC,
});

SettingsFactory.register("APPSMITH_OAUTH2_GITHUB_CLIENT_ID", {
  category: "authentication",
  subCategory: "github signup",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Client ID",
});

SettingsFactory.register("APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET", {
  category: "authentication",
  subCategory: "github signup",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Client Secret",
});

//version
SettingsFactory.register("APPSMITH_CURRENT_VERSION", {
  category: "version",
  controlType: SettingTypes.TEXT,
  label: "Current version",
});

SettingsFactory.register("APPSMITH_VERSION_READ_MORE", {
  action: (dispatch?: Dispatch<ReduxAction<boolean>>) => {
    dispatch &&
      dispatch({
        type: ReduxActionTypes.TOGGLE_RELEASE_NOTES,
        payload: true,
      });
  },
  category: "version",
  controlType: SettingTypes.LINK,
  label: "Release Notes",
});

//Advanced
SettingsFactory.register("APPSMITH_MONGODB_URI", {
  category: "advanced",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "MongoDB URI",
  subText:
    "Appsmith internally uses MongoDB. Change to an external MongoDb for Clustering",
});

SettingsFactory.register("APPSMITH_REDIS_URL", {
  category: "advanced",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "Redis URL",
  subText:
    "Appsmith internally uses redis for session storage. Change this to an external redis for Clustering",
});
