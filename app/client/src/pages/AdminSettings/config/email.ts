import { EMAIL_SETUP_DOC } from "constants/ThirdPartyConstants";
import { isEmail } from "utils/formhelpers";
import type { Dispatch } from "react";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { isNil, omitBy } from "lodash";
import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import {
  ADMIN_SETTINGS_EMAIL_WARNING,
  createMessage,
} from "ee/constants/messages";

export const config: AdminConfigType = {
  icon: "mail-line",
  type: SettingCategories.EMAIL,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "Email",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_MAIL_READ_MORE",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.CALLOUT,
      label: "How to configure?",
      url: EMAIL_SETUP_DOC,
    },
    {
      id: "APPSMITH_MAIL_WARNING",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.LINK,
      calloutType: "warning",
      label: createMessage(ADMIN_SETTINGS_EMAIL_WARNING),
    },
    {
      id: "APPSMITH_MAIL_HOST",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "SMTP host",
      placeholder: "email-smtp.us-east-2.amazonaws.com",
    },
    {
      id: "APPSMITH_MAIL_PORT",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.NUMBER,
      placeholder: "25",
      label: "SMTP port",
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
      label: "From address",
      placeholder: "admin@appsmith.com",
      validate: (value: string) => {
        if (value && !isEmail(value)) {
          return "Please enter a valid email id";
        }
      },
      subText:
        "* You will need to verify your from email address to begin sending emails",
    },
    {
      id: "APPSMITH_REPLY_TO",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Reply-to address",
      placeholder: "admin@appsmith.com",
      validate: (value: string) => {
        if (value && !isEmail(value)) {
          return "Please enter a valid email id";
        }
      },
      subText:
        "* You will need to verify your to email address to begin receiving emails",
    },
    {
      id: "APPSMITH_MAIL_SMTP_TLS_ENABLED",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TOGGLE,
      label: "TLS protected connection",
    },
    {
      id: "APPSMITH_MAIL_USERNAME",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "SMTP username",
    },
    {
      id: "APPSMITH_MAIL_PASSWORD",
      category: SettingCategories.EMAIL,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.PASSWORD,
      label: "SMTP password",
    },
    {
      id: "APPSMITH_MAIL_TEST_EMAIL",
      category: SettingCategories.EMAIL,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: (dispatch: Dispatch<ReduxAction<any>>, settings: any = {}) => {
        dispatch &&
          dispatch({
            type: ReduxActionTypes.SEND_TEST_EMAIL,
            payload: omitBy(
              {
                smtpHost: settings["APPSMITH_MAIL_HOST"],
                smtpPort: settings["APPSMITH_MAIL_PORT"],
                fromEmail: settings["APPSMITH_MAIL_FROM"],
                starttlsEnabled:
                  settings["APPSMITH_MAIL_SMTP_TLS_ENABLED"] || false,
                username: settings["APPSMITH_MAIL_USERNAME"],
                password: settings["APPSMITH_MAIL_PASSWORD"],
              },
              isNil,
            ),
          });
      },
      controlType: SettingTypes.BUTTON,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isDisabled: (settings?: Record<string, any>) => {
        return (
          !settings ||
          !settings["APPSMITH_MAIL_HOST"] ||
          !settings["APPSMITH_MAIL_FROM"]
        );
      },
      text: "Send test email",
    },
  ],
};
