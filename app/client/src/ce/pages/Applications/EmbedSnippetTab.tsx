import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  TooltipComponent,
  Classes,
  Icon,
} from "design-system-old";
import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import SwitchWrapper from "pages/Editor/AppSettingsPane/Components/SwitchWrapper";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import TooltipWrapper from "pages/Applications/EmbedSnippet/TooltipWrapper";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { PopoverPosition } from "@blueprintjs/core";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getCurrentApplication } from "selectors/editorSelectors";
import PrivateEmbeddingContent from "pages/Applications/EmbedSnippet/PrivateEmbeddingContent";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { ADMIN_SETTINGS_PATH } from "constants/routes";

export const EmbedSnippetContainer = styled.div<{ isAppSettings?: boolean }>`
  ${({ isAppSettings }) => isAppSettings && `padding: 0 16px;`}

  .icon:hover {
    svg path {
      fill: var(--ads-color-black-700);
    }
  }
`;

export const StyledLink = styled.a`
  position: relative;
  top: 1px;
  color: var(--ads-color-black-700);

  :hover {
    text-decoration: none;
    color: var(--ads-color-black-700);
  }

  .${Classes.TEXT} {
    border-bottom: 1px solid var(--ads-color-black-700);
  }

  .edit-line-icon {
    svg path {
      fill: var(--ads-color-black-500);
    }
  }
`;

export const StyledPreviewLink = styled.a`
  :hover {
    text-decoration: none;
  }
`;

export const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

export function EmbedSnippetTab({
  changeTab,
  isAppSettings,
}: {
  changeTab?: () => void;
  isAppSettings?: boolean;
}) {
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const embedSnippet = useUpdateEmbedSnippet();
  const userAppPermissions = currentApplicationDetails?.userPermissions ?? [];
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );
  const isPublicApp = currentApplicationDetails?.isPublic || false;

  return isPublicApp ? (
    <EmbedSnippetContainer isAppSettings={isAppSettings}>
      {isAppSettings && (
        <div>
          <div className="pt-3 pb-3 font-medium text-[color:var(--appsmith-color-black-800)]">
            {createMessage(IN_APP_EMBED_SETTING.embed)}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <div className="flex flex-1 flex-col gap-6">
          {embedSnippet.isSuperUser && (
            <div>
              <div className="flex justify-between items-center">
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
                      fill={Colors.GRAY_700}
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
            <div className="flex justify-between items-center">
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

        <EmbedCodeSnippet
          isAppSettings={isAppSettings}
          snippet={embedSnippet.appViewEndPoint}
        />
      </div>
      {!isAppSettings && (
        <div
          className={`flex justify-end border-t-2 mt-6 pt-5 border-[${Colors.GRAY_200}]`}
        >
          <StyledPreviewLink
            className="flex gap-1 items-center self-end"
            data-cy="preview-embed"
            href={embedSnippet.appViewEndPoint}
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
  ) : (
    <PrivateEmbeddingContent
      canMakeAppPublic={canShareWithPublic}
      changeTab={changeTab}
      isAppSettings={isAppSettings}
    />
  );
}

export default EmbedSnippetTab;
