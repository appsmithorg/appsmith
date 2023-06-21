import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Switch, Icon, Tooltip, Link, Text } from "design-system";
import useUpdateEmbedSnippet from "pages/Applications/EmbedSnippet/useUpdateEmbedSnippet";
import EmbedCodeSnippet from "pages/Applications/EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "selectors/editorSelectors";
import PrivateEmbeddingContent, {
  PrivateEmbedRampModal,
  PrivateEmbedRampSidebar,
} from "pages/Applications/EmbedSnippet/PrivateEmbeddingContent";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { ADMIN_SETTINGS_PATH } from "constants/routes";
import _ from "lodash";

export const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

export const BottomWrapper = styled.div`
  border-top: 1px solid var(--ads-v2-color-border);
`;

export const EmbedWrapper = styled.div`
  svg {
    path {
      fill: var(--ads-v2-color-fg-muted);
    }

    &:hover {
      path {
        fill: var(--ads-v2-color-fg);
      }
    }
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

  if (isAppSettings)
    return (
      <>
        <AppSettings />
        <div className="px-4">
          <PrivateEmbedRampSidebar />
        </div>
      </>
    );

  return <ShareModal />;
}

// get only the part of the url after the domain name
export const to = (url: string) => {
  const path = _.drop(
    url
      .toString()
      .replace(/([a-z])?:\/\//, "$1")
      .split("/"),
  ).join("/");
  return `/${path}`;
};

function ShareModal() {
  const embedSnippet = useUpdateEmbedSnippet();

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

      <EmbedCodeSnippet
        isAppSettings={false}
        snippet={embedSnippet.appViewEndPoint}
      />

      <PrivateEmbedRampModal />

      <BottomWrapper className={`flex justify-end pt-5`}>
        <Link
          className="flex gap-1 items-center self-end"
          data-testid="preview-embed"
          endIcon="share-box-line"
          target={"_blank"}
          to={to(embedSnippet.appViewEndPoint)}
        >
          {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
        </Link>
      </BottomWrapper>
    </div>
  );
}

function AppSettings() {
  const embedSnippet = useUpdateEmbedSnippet();

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

        <EmbedCodeSnippet
          isAppSettings
          snippet={embedSnippet.appViewEndPoint}
        />
      </div>
    </EmbedWrapper>
  );
}

export default EmbedSnippetTab;
