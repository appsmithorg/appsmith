import React from "react";
import {
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
  SIGNUP_RESTRICTION_DOC,
} from "constants/ThirdPartyConstants";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingSubCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import type { AuthMethodType } from "./AuthPage";
import { AuthPage } from "./AuthPage";
import Google from "assets/images/Google.png";
import SamlSso from "assets/images/saml.svg";
import OIDC from "assets/images/oidc.svg";
import Github from "assets/images/Github.png";
import Lock from "assets/images/lock-password-line.svg";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  JS_ORIGIN_URI_FORM,
  REDIRECT_URL_FORM,
} from "@appsmith/constants/forms";
import { useSelector } from "react-redux";
import { getThirdPartyAuths } from "@appsmith/selectors/tenantSelectors";

const { disableLoginForm } = getAppsmithConfigs();

const FormAuth: AdminConfigType = {
  type: SettingCategories.FORM_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Form Login",
  subText: "Enable your workspace to sign in with Appsmith Form.",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_FORM_LOGIN_DISABLED",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.TOGGLE,
      label: "Form Login",
      toggleText: (value: boolean) => (value ? "Disabled" : "Enabled"),
    },
    {
      id: "APPSMITH_SIGNUP_DISABLED",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.TOGGLE,
      label: "Form Signup",
      toggleText: (value: boolean) =>
        value
          ? "Allow only invited users to signup"
          : "Allow all users to signup",
    },
    {
      id: "APPSMITH_FORM_CALLOUT_BANNER",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.LINK,
      label:
        "The form login method does not verify the emails of users that create accounts.",
      url: SIGNUP_RESTRICTION_DOC,
      calloutType: "Warning",
    },
  ],
};

export const GoogleAuth: AdminConfigType = {
  type: SettingCategories.GOOGLE_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Google Authentication",
  subText: "Enable your workspace to sign in with Google (OAuth).",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GOOGLE_READ_MORE",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GOOGLE_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_JS_ORIGIN_URL",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "JavaScript Origin URL",
      formName: JS_ORIGIN_URI_FORM,
      fieldName: "js-origin-url-form",
      value: "",
      tooltip:
        "This URL will be used while configuring the Google OAuth Client ID's authorized JavaScript origins",
      helpText: "Paste this URL in your Google developer console.",
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_REDIRECT_URL",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "Redirect URL",
      formName: REDIRECT_URL_FORM,
      fieldName: "redirect-url-form",
      value: "/login/oauth2/code/google",
      tooltip:
        "This URL will be used while configuring the Google OAuth Client ID's authorized Redirect URIs",
      helpText: "Paste this URL in your Google developer console.",
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
      isRequired: true,
    },
    {
      id: "APPSMITH_SIGNUP_ALLOWED_DOMAINS",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Allowed Domains",
      placeholder: "domain1.com, domain2.com",
    },
  ],
};

export const GithubAuth: AdminConfigType = {
  type: SettingCategories.GITHUB_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Github Authentication",
  subText:
    "Enable your workspace to sign in with Github SAML single sign-on (SSO).",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GITHUB_READ_MORE",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GITHUB_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_ID",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
      isRequired: true,
    },
  ],
};

export const FormAuthCallout: AuthMethodType = {
  id: "APPSMITH_FORM_LOGIN_AUTH",
  category: SettingCategories.FORM_AUTH,
  label: "Form Login",
  subText: "Enable your workspace to sign in with Appsmith Form.",
  image: Lock,
  type: "LINK",
  isConnected: !disableLoginForm,
};

export const GoogleAuthCallout: AuthMethodType = {
  id: "APPSMITH_GOOGLE_AUTH",
  category: SettingCategories.GOOGLE_AUTH,
  label: "Google",
  subText:
    "Enable your workspace to sign in with Google (OAuth 2.0) single sign-on (SSO).",
  image: Google,
  type: "LINK",
};

export const GithubAuthCallout: AuthMethodType = {
  id: "APPSMITH_GITHUB_AUTH",
  category: SettingCategories.GITHUB_AUTH,
  label: "Github",
  subText:
    "Enable your workspace to sign in with Github (OAuth 2.0) single sign-on (SSO).",
  image: Github,
  type: "LINK",
};

export const SamlAuthCallout: AuthMethodType = {
  id: "APPSMITH_SAML_AUTH",
  category: "saml",
  label: "SAML 2.0",
  subText: `Enable your workspace to sign in with your preferred SAML2 compliant provider.`,
  image: SamlSso,
  needsUpgrade: true,
  type: "OTHER",
};

export const OidcAuthCallout: AuthMethodType = {
  id: "APPSMITH_OIDC_AUTH",
  category: "oidc",
  label: "OIDC",
  subText: `Enable your workspace to sign in with Open ID Connect.`,
  image: OIDC,
  needsUpgrade: true,
  type: "OTHER",
};

const AuthMethods = [
  OidcAuthCallout,
  SamlAuthCallout,
  GoogleAuthCallout,
  GithubAuthCallout,
  FormAuthCallout,
];

function AuthMain() {
  const socialLoginList = useSelector(getThirdPartyAuths);
  GoogleAuth.isConnected = GoogleAuthCallout.isConnected =
    socialLoginList.includes("google");
  GithubAuth.isConnected = GithubAuthCallout.isConnected =
    socialLoginList.includes("github");
  return <AuthPage authMethods={AuthMethods} />;
}

export const config: AdminConfigType = {
  icon: "lock-password-line",
  type: SettingCategories.AUTHENTICATION,
  controlType: SettingTypes.PAGE,
  title: "Authentication",
  canSave: false,
  children: [FormAuth, GoogleAuth, GithubAuth],
  component: AuthMain,
};
