import { EMAIL_SETUP_DOC } from "constants/ThirdPartyConstants";
import { isEmail } from "utils/formhelpers";
import { Dispatch } from "react";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { isNil, omitBy } from "lodash";
import {
  AdminConfigType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export const config: AdminConfigType = {
  type: SettingCategories.EMAIL,
  controlType: SettingTypes.GROUP,
  title: "Email",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_MAIL_READ_MORE",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: EMAIL_SETUP_DOC,
    },
    {
      id: "APPSMITH_MAIL_HOST",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "SMTP Host",
      placeholder: "email-smtp.us-east-2.amazonaws.com",
    },
    {
      id: "APPSMITH_MAIL_PORT",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.NUMBER,
      placeholder: "25",
      label: "SMTP Port",
      validate: (value: string) => {
        const port = parseInt(value);
        if (value && (port < 0 || port > 65535)) {
          return "Please enter a valid port";
        }
      },
    },
    {
      id: "APPSMITH_MAIL_FROM",
      category: SettingCategories.EMAIL,
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
    },
    {
      id: "APPSMITH_REPLY_TO",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Reply-To Address",
      placeholder: "admin@appsmith.com",
      validate: (value: string) => {
        if (value && !isEmail(value)) {
          return "Please enter a valid email id";
        }
      },
      subText:
        "You will need to verify your to email address to begin receiving emails",
    },
    {
      id: "APPSMITH_MAIL_SMTP_TLS_ENABLED",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TOGGLE,
      label: "TLS Protected Connection",
    },
    {
      id: "APPSMITH_MAIL_USERNAME",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "SMTP Username",
      isVisible: (values: Record<string, any>) => {
        return values && values["APPSMITH_MAIL_SMTP_TLS_ENABLED"];
      },
    },
    {
      id: "APPSMITH_MAIL_PASSWORD",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.PASSWORD,
      label: "SMTP Password",
      isVisible: (values: Record<string, any>) => {
        return values && values["APPSMITH_MAIL_SMTP_TLS_ENABLED"];
      },
    },
    {
      id: "APPSMITH_MAIL_TEST_EMAIL",
      category: SettingCategories.EMAIL,
      action: (dispatch: Dispatch<ReduxAction<any>>, settings: any = {}) => {
        dispatch &&
          dispatch({
            type: ReduxActionTypes.SEND_TEST_EMAIL,
            payload: omitBy(
              {
                smtpHost: settings["APPSMITH_MAIL_HOST"],
                smtpPort: settings["APPSMITH_MAIL_PORT"],
                fromEmail: settings["APPSMITH_MAIL_FROM"],
                username: settings["APPSMITH_MAIL_USERNAME"],
                password: settings["APPSMITH_MAIL_PASSWORD"],
              },
              isNil,
            ),
          });
      },
      controlType: SettingTypes.BUTTON,
      isDisabled: (settings: Record<string, any>) => {
        return (
          !settings ||
          !settings["APPSMITH_MAIL_HOST"] ||
          !settings["APPSMITH_MAIL_FROM"]
        );
      },
      text: "Send Test Email",
    },
  ],
};
