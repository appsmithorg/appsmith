export * from "ce/pages/Applications/EmbedSnippetTab";
import {
  BottomWrapper,
  default as CE_EmbedSnippetTab,
  EmbedWrapper,
  StyledPropertyHelpLabel,
} from "ce/pages/Applications/EmbedSnippetTab";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import {
  createMessage,
  DOCUMENTATION,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "selectors/editorSelectors";
import { EMBED_PRIVATE_APPS_DOC } from "constants/ThirdPartyConstants";
import { ADMIN_SETTINGS_PATH } from "constants/routes";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  Icon,
  Link,
  Radio,
  RadioGroup,
  Switch,
  Text,
  Tooltip,
} from "design-system";

const { cloudHosting } = getAppsmithConfigs();

const options = [
  {
    label: "OIDC",
    value: "oidc",
  },
  {
    label: "SAML",
    value: "saml",
  },
  {
    label: "Google OAuth",
    value: "google",
  },
];

const getPrivateEmbedUrl = (url: string, method: string) => {
  const fullUrl = new URL(url);
  fullUrl.searchParams.append("ssoTrigger", method);
  return fullUrl.toString();
};

export function EmbedSnippetTab({
  isAppSettings,
}: {
  isAppSettings?: boolean;
}) {
  if (isAppSettings) return <AppSettings />;

  return <ShareModal />;
}

function ShareModal() {
  const embedSnippet = useUpdateEmbedSnippet();
  const [selectedMethod, setSelectedMethod] = useState<string>("oidc");
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isPublicApp = currentApplicationDetails?.isPublic || false;
  const snippetUrl = isPublicApp
    ? embedSnippet.appViewEndPoint
    : getPrivateEmbedUrl(embedSnippet.appViewEndPoint, selectedMethod);

  return (
    <div className="flex flex-col gap-6">
      {embedSnippet.isSuperUser && (
        <div className="flex justify-between">
          <div className="flex gap-1" data-testid="frame-ancestors-setting">
            <Icon
              className="icon"
              name={embedSnippet.embedSettingContent.icon}
              size="md"
            />
            <Text>{embedSnippet.embedSettingContent.label}</Text>
            <Tooltip
              content={embedSnippet.embedSettingContent.tooltip}
              placement="top"
            >
              <Icon
                className="ml-1 cursor-pointer"
                name="question-line"
                size="md"
              />
            </Tooltip>
          </div>
          <Link
            data-testid="t--change-embedding-restriction"
            target="_self"
            to={ADMIN_SETTINGS_PATH}
          >
            {createMessage(IN_APP_EMBED_SETTING.change)}
          </Link>
        </div>
      )}

      <Switch
        data-testid={"show-navigation-bar-toggle"}
        defaultSelected={embedSnippet.currentEmbedSetting?.showNavigationBar}
        onChange={() =>
          embedSnippet.onChange({
            showNavigationBar:
              !embedSnippet.currentEmbedSetting.showNavigationBar,
          })
        }
      >
        {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
      </Switch>

      {!isPublicApp && (
        <div data-testid="t--sso-methods">
          <div className="flex items-center justify-between mb-2">
            <Text>SSO Method</Text>
            <Link
              className="t--documentation-link"
              endIcon="share-box-line"
              target="_blank"
              to={EMBED_PRIVATE_APPS_DOC}
            >
              {createMessage(DOCUMENTATION)}
            </Link>
          </div>
          <RadioGroup
            defaultValue={selectedMethod}
            onChange={(value: string) => setSelectedMethod(value)}
          >
            {options.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        </div>
      )}

      <EmbedCodeSnippet isAppSettings={false} snippet={snippetUrl} />

      <BottomWrapper className={`flex justify-end pt-5`}>
        <Link
          className="flex gap-1 items-center self-end"
          data-testid="preview-embed"
          endIcon="share-box-line"
          target={"_blank"}
          to={snippetUrl}
        >
          {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
        </Link>
      </BottomWrapper>
    </div>
  );
}

function AppSettings() {
  const embedSnippet = useUpdateEmbedSnippet();
  const [selectedMethod, setSelectedMethod] = useState<string>("oidc");
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const isPublicApp = currentApplicationDetails?.isPublic || false;
  const snippetUrl = isPublicApp
    ? embedSnippet.appViewEndPoint
    : getPrivateEmbedUrl(embedSnippet.appViewEndPoint, selectedMethod);

  return (
    <EmbedWrapper className="px-4">
      <Text className="pt-3 pb-3" kind="heading-xs" renderAs="p">
        {createMessage(IN_APP_EMBED_SETTING.embed)}
      </Text>

      <div className="flex flex-col gap-6">
        {embedSnippet.isSuperUser && (
          <div className="flex justify-between">
            <div className="flex gap-1" data-testid="frame-ancestors-setting">
              <Icon
                className="icon"
                name={embedSnippet.embedSettingContent.icon}
                size="md"
              />
              <StyledPropertyHelpLabel
                label={embedSnippet.embedSettingContent.label}
                lineHeight="1.17"
                maxWidth="217px"
                tooltip={embedSnippet.embedSettingContent.tooltip}
              />
            </div>
            <Link
              data-testid="t--change-embedding-restriction"
              endIcon="pencil-line"
              target="_self"
              to={ADMIN_SETTINGS_PATH}
            >
              {""}
            </Link>
          </div>
        )}

        <Switch
          data-testid={"show-navigation-bar-toggle"}
          defaultSelected={embedSnippet.currentEmbedSetting?.showNavigationBar}
          onChange={() =>
            embedSnippet.onChange({
              showNavigationBar:
                !embedSnippet.currentEmbedSetting.showNavigationBar,
            })
          }
        >
          {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
        </Switch>

        {!isPublicApp && (
          <div data-testid="t--sso-methods">
            <div className="flex items-center justify-between mb-2">
              <Text>SSO Method</Text>
              <Link
                className="t--documentation-link"
                endIcon="book-line"
                target="_blank"
                to={EMBED_PRIVATE_APPS_DOC}
              >
                {""}
              </Link>
            </div>
            <RadioGroup
              defaultValue={selectedMethod}
              onChange={(value: string) => setSelectedMethod(value)}
            >
              {options.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        )}

        <EmbedCodeSnippet isAppSettings snippet={snippetUrl} />
      </div>
    </EmbedWrapper>
  );
}

export default cloudHosting ? CE_EmbedSnippetTab : EmbedSnippetTab;
