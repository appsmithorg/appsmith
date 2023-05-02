import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Switch, Icon, Tooltip, Link, Text } from "design-system";
import { Colors } from "constants/Colors";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "selectors/editorSelectors";
import PrivateEmbeddingContent from "pages/Applications/EmbedSnippet/PrivateEmbeddingContent";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { ADMIN_SETTINGS_PATH } from "constants/routes";

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

  const isPublicApp = currentApplicationDetails?.isPublic || false;

  if (!isPublicApp) {
    return (
      <PrivateEmbeddingContent
        changeTab={changeTab}
        isAppSettings={isAppSettings}
        userAppPermissions={currentApplicationDetails?.userPermissions ?? []}
      />
    );
  }

  if (isAppSettings) return <AppSettings />;

  return <ShareModal />;
}

function ShareModal() {
  const embedSnippet = useUpdateEmbedSnippet();
  return (
    <div className="flex flex-col gap-6">
      {embedSnippet.isSuperUser && (
        <div className="flex justify-between">
          <div className="flex">
            <Text>{embedSnippet.embedSettingContent.label}</Text>

            <Tooltip
              content={embedSnippet.embedSettingContent.tooltip}
              placement="top"
            >
              <Icon className="ml-1" name="question-fill" size="md" />
            </Tooltip>
          </div>
          <Link
            data-testid="t--change-embedding-restriction"
            to={ADMIN_SETTINGS_PATH}
          >
            {createMessage(IN_APP_EMBED_SETTING.change)}
          </Link>
        </div>
      )}

      <Switch
        data-cy={"show-navigation-bar-toggle"}
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

      <EmbedCodeSnippet
        isAppSettings={false}
        snippet={embedSnippet.appViewEndPoint}
      />
      <div
        className={`flex justify-end border-t-2 mt-6 pt-5 border-[${Colors.GRAY_200}]`}
      >
        <Link
          className="flex gap-1 items-center self-end"
          data-cy="preview-embed"
          endIcon="share-box-line"
          href={embedSnippet.appViewEndPoint}
          target={"_blank"}
        >
          {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
        </Link>
      </div>
    </div>
  );
}

function AppSettings() {
  const embedSnippet = useUpdateEmbedSnippet();

  return (
    <div className="px-4 flex flex-col gap-3">
      <Text className="pt-3" kind="heading-xs">
        {createMessage(IN_APP_EMBED_SETTING.embed)}
      </Text>

      {embedSnippet.isSuperUser && (
        <div className="flex justify-between">
          <StyledPropertyHelpLabel
            label={embedSnippet.embedSettingContent.label}
            lineHeight="1.17"
            maxWidth="217px"
            tooltip={embedSnippet.embedSettingContent.tooltip}
          />
          <Link
            data-testid="t--change-embedding-restriction"
            endIcon="pencil-line"
            href={ADMIN_SETTINGS_PATH}
          >
            {""}
          </Link>
        </div>
      )}

      <Switch
        data-cy={"show-navigation-bar-toggle"}
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

      <EmbedCodeSnippet isAppSettings snippet={embedSnippet.appViewEndPoint} />
    </div>
  );
}

export default EmbedSnippetTab;
