import {
  config as CE_config,
  Form_Auth_Callout,
  Github_Auth_Callout,
  Google_Auth_Callout,
  Saml_Auth_Callout,
} from "ce/pages/AdminSettings/config/authentication";
import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
  SettingSubtype,
} from "@appsmith/pages/AdminSettings/config/types";
import { AuthMethodType, AuthPage } from "./AuthPage";
import OIDC from "assets/images/oidc.svg";
import React from "react";
import { getAppsmithConfigs } from "@appsmith/configs";

const { enableOidcOAuth } = getAppsmithConfigs();

const OIDC_Auth: AdminConfigType = {
  type: SettingCategories.OIDC_AUTH,
  controlType: SettingTypes.GROUP,
  title: "OpenID Connect",
  subText:
    "Enable your organization to sign in with your preferred OIDC compliant provider.",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_OIDC_READ_MORE",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.LINK,
      label: "How to configure?",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_ID",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_SECRET",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_AUTHORIZATION_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Authorization URL",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_TOKEN_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Token URL",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_USER_INFO",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "User Info URL",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_JWK_SET_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: "oidc signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "JWK Set URL",
    },
  ],
};

export const Oidc_Auth_Callout: AuthMethodType = {
  id: "APPSMITH_OIDC_AUTH",
  category: SettingCategories.OIDC_AUTH,
  label: "OIDC",
  subText: `Enable your organization to sign in with your preferred OIDC compliant provider.`,
  image: OIDC,
  type: "LINK",
  isConnected: enableOidcOAuth,
};

const AuthMethods = [
  Oidc_Auth_Callout,
  Saml_Auth_Callout,
  Google_Auth_Callout,
  Github_Auth_Callout,
  Form_Auth_Callout,
];

function AuthMain() {
  return <AuthPage authMethods={AuthMethods} />;
}

export const config: AdminConfigType = {
  ...CE_config,
  children: Array.isArray(CE_config.children)
    ? [...CE_config.children, OIDC_Auth]
    : [],
  component: AuthMain,
};
