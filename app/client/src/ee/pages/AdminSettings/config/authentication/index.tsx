import { useSelector } from "react-redux";

export * from "ce/pages/AdminSettings/config/authentication";
import {
  config as CE_config,
  FormAuthCallout,
  GithubAuthCallout,
  GithubAuth,
  GoogleAuthCallout,
  GoogleAuth,
} from "ce/pages/AdminSettings/config/authentication";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
  SettingSubtype,
  CategoryType,
} from "@appsmith/pages/AdminSettings/config/types";
import { Saml } from "@appsmith/pages/AdminSettings/SAML";
import Oidc from "@appsmith/pages/AdminSettings/OIDC";
import type { AuthMethodType } from "./AuthPage";
import { AuthPage } from "./AuthPage";
import SamlSso from "assets/images/saml.svg";
import OIDC from "assets/images/oidc.svg";
import React from "react";
import { OIDC_SIGNUP_SETUP_DOC } from "constants/ThirdPartyConstants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  getIsFormLoginEnabled,
  getThirdPartyAuths,
} from "@appsmith/selectors/tenantSelectors";
import {
  OIDC_AUTH_DESC,
  REDIRECT_URL_TOOLTIP,
  SAML_AUTH_DESC,
  createMessage,
} from "@appsmith/constants/messages";
import { isSSOEnabled } from "@appsmith/utils/planHelpers";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";

const featureFlags = selectFeatureFlags(store.getState());

const SamlAuth: AdminConfigType = {
  type: SettingCategories.SAML_AUTH,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.PAGE,
  title: "SAML 2.0",
  component: Saml,
  subText: createMessage(SAML_AUTH_DESC),
  canSave: true,
  isFeatureEnabled: isSSOEnabled(featureFlags),
};

const OidcAuth: AdminConfigType = {
  type: SettingCategories.OIDC_AUTH,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.PAGE,
  title: "OpenID connect",
  component: Oidc,
  subText: createMessage(OIDC_AUTH_DESC),
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_OIDC_READ_MORE",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: OIDC_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_REDIRECT_URL",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "Redirect URL",
      fieldName: "redirect-url-form",
      value: "/login/oauth2/code/oidc",
      tooltip: createMessage(REDIRECT_URL_TOOLTIP),
      helpText: "Paste this URL in your IdP service providers console.",
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_ID",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_CLIENT_SECRET",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client secret",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_AUTHORIZATION_URI",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Authorization URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_TOKEN_URI",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Token URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_USER_INFO",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "User info URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_JWK_SET_URI",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "JWK set URL",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_SCOPE",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TAGINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Scope",
      subText: "* It accepts multiple values",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_USERNAME_ATTRIBUTE",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Username attribute",
      subText: "* Name of the claim which represents the email of the user",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_OIDC_ADVANCED",
      category: SettingCategories.OIDC_AUTH,
      controlType: SettingTypes.ACCORDION,
      label: "Advanced",
      advanced: [
        {
          id: "APPSMITH_OAUTH2_OIDC_SIGNING_ALGO",
          category: SettingCategories.OIDC_AUTH,
          controlType: SettingTypes.DROPDOWN,
          label: "Token signing algorithm",
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
        {
          id: "APPSMITH_OAUTH2_OIDC_AUDIENCE",
          category: SettingCategories.OIDC_AUTH,
          controlType: SettingTypes.TEXTINPUT,
          label: "Audience",
        },
      ],
    },
  ],
  isFeatureEnabled: isSSOEnabled(featureFlags),
};

export const SamlAuthCallout: AuthMethodType = {
  id: "APPSMITH_SAML_AUTH",
  category: SettingCategories.SAML_AUTH,
  label: "SAML 2.0",
  subText: createMessage(SAML_AUTH_DESC),
  image: SamlSso,
  isFeatureEnabled: isSSOEnabled(featureFlags),
};

export const OidcAuthCallout: AuthMethodType = {
  id: "APPSMITH_OIDC_AUTH",
  category: SettingCategories.OIDC_AUTH,
  label: "OIDC",
  subText: createMessage(OIDC_AUTH_DESC),
  image: OIDC,
  isFeatureEnabled: isSSOEnabled(featureFlags),
};

const isAirgappedInstance = isAirgapped();

const AuthMethods = [
  OidcAuthCallout,
  SamlAuthCallout,
  GoogleAuthCallout,
  GithubAuthCallout,
  FormAuthCallout,
].filter((method) =>
  isAirgappedInstance
    ? method !== GoogleAuthCallout && method !== GithubAuthCallout
    : true,
);

function AuthMain() {
  FormAuthCallout.isConnected = useSelector(getIsFormLoginEnabled);
  const socialLoginList = useSelector(getThirdPartyAuths);
  GoogleAuth.isConnected = GoogleAuthCallout.isConnected =
    socialLoginList.includes("google");
  GithubAuth.isConnected = GithubAuthCallout.isConnected =
    socialLoginList.includes("github");
  OidcAuth.isConnected = OidcAuthCallout.isConnected =
    socialLoginList.includes("oidc");
  SamlAuth.isConnected = SamlAuthCallout.isConnected =
    socialLoginList.includes("saml");
  return <AuthPage authMethods={AuthMethods} />;
}

export const config: AdminConfigType = {
  ...CE_config,
  children: Array.isArray(CE_config.children)
    ? [...CE_config.children, SamlAuth, OidcAuth].filter((method) =>
        isAirgappedInstance
          ? method.type !== SettingCategories.GOOGLE_AUTH &&
            method.type !== SettingCategories.GITHUB_AUTH
          : true,
      )
    : [],
  component: AuthMain,
};
