export * from "ce/pages/Applications/EmbedSnippetTab";
import {
  EmbedSnippetContainer,
  StyledLink,
  StyledPreviewLink,
  StyledPropertyHelpLabel,
} from "ce/pages/Applications/EmbedSnippetTab";
import { default as CE_EmbedSnippetTab } from "ce/pages/Applications/EmbedSnippetTab";
import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  TooltipComponent,
  Icon,
  RadioComponent,
} from "design-system-old";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import SwitchWrapper from "pages/Editor/AppSettingsPane/Components/SwitchWrapper";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import TooltipWrapper from "pages/Applications/EmbedSnippet/TooltipWrapper";
import {
  createMessage,
  DOCUMENTATION,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { PopoverPosition } from "@blueprintjs/core";
import { getCurrentApplication } from "selectors/editorSelectors";
import { EMBED_PRIVATE_APPS_DOC } from "constants/ThirdPartyConstants";
import { ADMIN_SETTINGS_PATH } from "constants/routes";
import { getAppsmithConfigs } from "@appsmith/configs";

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

const SSOMethodsWrapper = styled.div`
  .radio-group {
    label {
      margin: 8px 0;
    }
  }

  .book-line-icon {
    svg path {
      fill: var(--ads-color-black-500);
    }
  }

  .documentation-link-text {
    border: none;
  }
`;

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
  const [selectedMethod, setSelectedMethod] = useState<string>("oidc");
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const embedSnippet = useUpdateEmbedSnippet();
  const isPublicApp = currentApplicationDetails?.isPublic || false;

  const snippetUrl = isPublicApp
    ? embedSnippet.appViewEndPoint
    : getPrivateEmbedUrl(embedSnippet.appViewEndPoint, selectedMethod);

  return (
    <EmbedSnippetContainer isAppSettings={isAppSettings}>
      {isAppSettings && (
        <div>
          <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
            {createMessage(IN_APP_EMBED_SETTING.embed)}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col flex-1 gap-6 pt-2">
          {embedSnippet.isSuperUser && (
            <div>
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-1 pt-0.5 text-[color:var(--appsmith-color-black-700)]"
                  data-cy={"frame-ancestors-setting"}
                >
                  <Icon
                    className="icon"
                    name={embedSnippet.embedSettingContent.icon}
                    size={IconSize.XXL}
                  />
                  {isAppSettings ? (
                    <StyledPropertyHelpLabel
                      label={embedSnippet.embedSettingContent.label}
                      lineHeight="1.17"
                      maxWidth="217px"
                      tooltip={embedSnippet.embedSettingContent.tooltip}
                    />
                  ) : (
                    <>
                      <Text type={TextType.P1}>
                        {embedSnippet.embedSettingContent.label}
                      </Text>

                      <TooltipComponent
                        boundary="viewport"
                        content={
                          <TooltipWrapper className="text-center max-h-11">
                            {embedSnippet.embedSettingContent.tooltip}
                          </TooltipWrapper>
                        }
                        position={PopoverPosition.TOP}
                      >
                        <Icon
                          className={`ml-1 icon`}
                          fillColor={Colors.GRAY2}
                          name={"question-fill"}
                          size={IconSize.XL}
                        />
                      </TooltipComponent>
                    </>
                  )}
                </div>
                <StyledLink
                  data-testid="t--change-embedding-restriction"
                  href={ADMIN_SETTINGS_PATH}
                >
                  {isAppSettings ? (
                    <Icon
                      className="edit-line-icon icon"
                      fill={Colors.GRAY_500}
                      name="edit-line"
                      size={IconSize.XXL}
                    />
                  ) : (
                    <Text
                      case={Case.UPPERCASE}
                      color={Colors.GRAY_700}
                      type={TextType.BUTTON_SMALL}
                    >
                      {createMessage(IN_APP_EMBED_SETTING.change)}
                    </Text>
                  )}
                </StyledLink>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <Text type={TextType.P1}>
                {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
              </Text>
              <SwitchWrapper>
                <Switch
                  className="mb-0"
                  data-cy={"show-navigation-bar-toggle"}
                  defaultChecked={
                    embedSnippet.currentEmbedSetting?.showNavigationBar
                  }
                  large
                  onChange={() =>
                    embedSnippet.onChange({
                      showNavigationBar:
                        !embedSnippet.currentEmbedSetting.showNavigationBar,
                    })
                  }
                />
              </SwitchWrapper>
            </div>
          </div>
        </div>

        {!isPublicApp && (
          <SSOMethodsWrapper data-testid="t--sso-methods">
            <div className="flex items-center justify-between">
              <Text type={TextType.P1}>SSO Method</Text>
              <StyledLink
                data-testid="t--documentation-link"
                href={EMBED_PRIVATE_APPS_DOC}
                target="_blank"
              >
                {isAppSettings ? (
                  <Icon
                    className="book-line-icon icon"
                    fill={Colors.GRAY_500}
                    name="book-line"
                    size={IconSize.XXL}
                  />
                ) : (
                  <Text
                    case={Case.UPPERCASE}
                    className="flex items-center gap-1 documentation-link-text"
                    color={Colors.GRAY_700}
                    type={TextType.BUTTON_SMALL}
                  >
                    {createMessage(DOCUMENTATION)}
                    <Icon
                      className="icon"
                      fill={Colors.GRAY_700}
                      name="external-link-line"
                      size={IconSize.XXL}
                    />
                  </Text>
                )}
              </StyledLink>
            </div>
            <RadioComponent
              backgroundColor={Colors.GREY_900}
              className="flex flex-col radio-group"
              defaultValue={selectedMethod}
              onSelect={(value: string) => setSelectedMethod(value)}
              options={options}
            />
          </SSOMethodsWrapper>
        )}

        <EmbedCodeSnippet isAppSettings={isAppSettings} snippet={snippetUrl} />
      </div>
      {!isAppSettings && (
        <div
          className={`flex justify-end border-t-2 mt-6 pt-5 border-[${Colors.GRAY_200}]`}
        >
          <StyledPreviewLink
            className="flex items-center self-end gap-1"
            data-cy="preview-embed"
            href={snippetUrl}
            target={"_blank"}
          >
            <Icon
              className="icon"
              fillColor={Colors.GRAY_700}
              name="external-link-line"
              size={IconSize.XL}
            />
            <Text color={Colors.GRAY_700} type={TextType.P4}>
              {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
            </Text>
          </StyledPreviewLink>
        </div>
      )}
    </EmbedSnippetContainer>
  );
}

export default cloudHosting ? CE_EmbedSnippetTab : EmbedSnippetTab;
