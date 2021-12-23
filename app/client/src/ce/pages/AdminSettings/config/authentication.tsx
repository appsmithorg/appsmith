import React from "react";

import {
  GOOGLE_SIGNUP_SETUP_DOC,
  GITHUB_SIGNUP_SETUP_DOC,
} from "constants/ThirdPartyConstants";
import {
  SettingCategories,
  SettingTypes,
  SettingSubtype,
  AdminConfigType,
} from "@appsmith/pages/AdminSettings/config/types";

import styled from "styled-components";
import Button, { Category } from "components/ads/Button";
import { createMessage, ADD } from "constants/messages";
import { getAdminSettingsCategoryUrl } from "constants/routes";
import Google from "assets/images/Google.png";
import Github from "assets/images/Github.png";
import Lock from "assets/images/lock-password-line.svg";

const Form_Auth: AdminConfigType = {
  type: SettingCategories.FORM_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Form Login",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_SIGNUP_DISABLED",
      category: SettingCategories.FORM_AUTH,
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
    },
  ],
};

const Google_Auth: AdminConfigType = {
  type: SettingCategories.GOOGLE_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Google Auth",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GOOGLE_READ_MORE",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: "google signup",
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GOOGLE_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: "google signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: "google signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
    },
    {
      id: "APPSMITH_SIGNUP_ALLOWED_DOMAINS",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: "google signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Allowed Domains",
      placeholder: "domain1.com, domain2.com",
    },
  ],
};

const Github_Auth: AdminConfigType = {
  type: SettingCategories.GITHUB_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Github Auth",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GITHUB_READ_MORE",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: "github signup",
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GITHUB_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_ID",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: "github signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: "github signup",
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client Secret",
    },
  ],
};

const PageSettings = {
  settings: [
    {
      id: "APPSMITH_GOOGLE_AUTH",
      category: "google-auth",
      controlType: SettingTypes.BUTTON,
      label: "Google",
      subText: "Enable your organization to sign in with Google (OAuth).",
      image: Google,
    },
    {
      id: "APPSMITH_GITHUB_AUTH",
      category: "github-auth",
      controlType: SettingTypes.BUTTON,
      label: "Github",
      subText: `Enable your organization to sign in with your preferred SAML2 compliant provider like Ping
      Identity, Google SAML, Keycloak, or VMware Identity Manager.`,
      image: Github,
    },
    {
      id: "APPSMITH_FORM_LOGIN_AUTH",
      category: "form-login-auth",
      controlType: SettingTypes.BUTTON,
      label: "Form Login",
      subText: "Enable your organization to sign in with Google (OAuth).",
      image: Lock,
    },
  ],
};

const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding-left: ${(props) =>
    props.theme.homePage.leftPane.rightMargin +
    props.theme.homePage.leftPane.leftPadding}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

const SettingsFormWrapper = styled.div``;

const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0;
`;

const SettingsSubHeader = styled.div`
  font-size: 14px;
  margin-bottom: 0;
`;

const MethodCard = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0;
`;

const Image = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 8px;
  background: #f0f0f0;
  object-fit: cover;
  border-radius: 50%;
  padding: 5px;
`;

const MethodDetailsWrapper = styled.div`
  color: #2e3d49;
  width: 492px;
  margin-right: 108px;
`;

const MethodTitle = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
`;

const MethodDets = styled.div`
  font-size: 12px;
  line-height: 16px;
`;

const authMain = () => {
  return (
    <Wrapper>
      <SettingsFormWrapper>
        <SettingsHeader>Select Authetication Method</SettingsHeader>
        <SettingsSubHeader>
          Select a protocol you want to authenticate users with
        </SettingsSubHeader>
        {PageSettings &&
          PageSettings.settings &&
          PageSettings.settings.length > 0 &&
          PageSettings.settings.map((method) => {
            return (
              <MethodCard key={method.id}>
                <Image alt={method.label} src={method.image} />
                <MethodDetailsWrapper>
                  <MethodTitle>{method.label}</MethodTitle>
                  <MethodDets>{method.subText}</MethodDets>
                </MethodDetailsWrapper>
                <Button
                  category={Category.tertiary}
                  className={"add-button"}
                  data-cy="add-auth-account"
                  href={getAdminSettingsCategoryUrl(
                    SettingCategories.AUTHENTICATION,
                    method.category,
                  )}
                  text={createMessage(ADD)}
                />
              </MethodCard>
            );
          })}
      </SettingsFormWrapper>
    </Wrapper>
  );
};

export const config: AdminConfigType = {
  type: SettingCategories.AUTHENTICATION,
  controlType: SettingTypes.PAGE,
  title: "Authentication",
  canSave: false,
  children: [Form_Auth, Google_Auth, Github_Auth],
  component: authMain,
};
