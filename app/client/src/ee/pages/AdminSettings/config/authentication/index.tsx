export * from "ce/pages/AdminSettings/config/authentication/index";
import {
  config as CE_config,
  FormAuthCallout,
  GithubAuthCallout,
  GoogleAuthCallout,
} from "ce/pages/AdminSettings/config/authentication";
import {
  AdminConfigType,
  SettingCategories,
  SettingSubCategories,
  SettingTypes,
  SettingSubtype,
} from "@appsmith/pages/AdminSettings/config/types";
import { Saml } from "@appsmith/pages/AdminSettings/saml";
import Oidc from "@appsmith/pages/AdminSettings/oidc";
import { AuthMethodType, AuthPage } from "./AuthPage";
import SamlSso from "assets/images/saml.svg";
import OIDC from "assets/images/oidc.svg";
import React from "react";
import { getAppsmithConfigs } from "@appsmith/configs";
import { OIDC_SIGNUP_SETUP_DOC } from "constants/ThirdPartyConstants";
import { REDIRECT_URL_FORM } from "constants/forms";

const { enableOidcOAuth, enableSamlOAuth } = getAppsmithConfigs();

const SsoAuth: AdminConfigType = {
  type: SettingCategories.SAML_AUTH,
  controlType: SettingTypes.PAGE,
  title: "SAML 2.0",
  component: Saml,
  subText:
    "Enable your organization to sign in with your preferred SAML2 compliant provider.",
  canSave: true,
  isConnected: enableSamlOAuth,
};

const OidcAuth: AdminConfigType = {
  type: SettingCategories.OIDC_AUTH,
  controlType: SettingTypes.PAGE,
  title: "OpenID Connect",
  component: Oidc,
  subText:
    "Enable your organization to sign in with your preferred OIDC compliant provider.",
  canSave: true,
  isConnected: enableOidcOAuth,
  settings: [
    {
      id: "APPSMITH_OAUTH2_OIDC_READ_MORE",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: OIDC_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_REDIRECT_URL",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "Redirect URL",
      formName: REDIRECT_URL_FORM,
      fieldName: "redirect-url-form",
      value: "/login/oauth2/code/oidc",
      helpText: "Paste this URL in your IdP service providers console.",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_ID",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_SECRET",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_AUTHORIZATION_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Authorization URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_TOKEN_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Token URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_USER_INFO",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "User Info URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_JWK_SET_URI",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "JWK Set URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_SCOPE",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TAGINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Scope",
      subText: "It accepts multiple values",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Username Attribute",
      subText: "Name of the claim which represents the email of the user",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_ADVANCED",
      category: SettingCategories.OIDC_AUTH,
      subCategory: SettingSubCategories.OIDC,
      controlType: SettingTypes.ACCORDION,
      label: "Advanced",
      advanced: [
        {
          id: "APPSMITH_OAUTH2_OIDC_SIGNING_ALGO",
          category: SettingCategories.OIDC_AUTH,
          subCategory: SettingSubCategories.OIDC,
          controlType: SettingTypes.DROPDOWN,
          label: "Token Signing Algorithm",
          dropdownOptions: [
            { id: "RS256", value: "RS256" },
            { id: "RS384", value: "RS384" },
            { id: "RS512", value: "RS512" },
            { id: "ES256", value: "ES256" },
            { id: "ES384", value: "ES384" },
            { id: "ES512", value: "ES512" },
            { id: "PS256", value: "PS256" },
            { id: "PS384", value: "PS384" },
            { id: "PS512", value: "PS512" },
          ],
        },
      ],
    },
  ],
};

export const SamlAuthCallout: AuthMethodType = {
  id: "APPSMITH_SAML_AUTH",
  category: SettingCategories.SAML_AUTH,
  label: "SAML 2.0",
  subText: `Enable your organization to sign in with your preferred SAML2 compliant provider.`,
  image: SamlSso,
  type: "LINK",
  isConnected: enableSamlOAuth,
};

export const OidcAuthCallout: AuthMethodType = {
  id: "APPSMITH_OIDC_AUTH",
  category: SettingCategories.OIDC_AUTH,
  label: "OIDC",
  subText: `Enable your organization to sign in with your preferred OIDC compliant provider.`,
  image: OIDC,
  type: "LINK",
  isConnected: enableOidcOAuth,
};

const AuthMethods = [
  OidcAuthCallout,
  SamlAuthCallout,
  GoogleAuthCallout,
  GithubAuthCallout,
  FormAuthCallout,
];

function AuthMain() {
  return <AuthPage authMethods={AuthMethods} />;
}

export const config: AdminConfigType = {
  ...CE_config,
  children: Array.isArray(CE_config.children)
    ? [...CE_config.children, SsoAuth, OidcAuth]
    : [],
  component: AuthMain,
};
