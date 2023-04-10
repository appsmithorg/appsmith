import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Switch, Tooltip } from "design-system";
import useUpdateEmbedSnippet from "./EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "./EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "./EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import classNames from "classnames";
import { Icon, Link } from "design-system";

const Text = styled.p`
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
`;

const StyledPreviewLink = styled.a`
  :hover {
    text-decoration: none;
  }
`;

function EmbedSnippetTab() {
  const embedSnippet = useUpdateEmbedSnippet();
  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col">
          {embedSnippet.isSuperUser && (
            <div className="pt-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 pt-0.5 text-[color:var(--appsmith-color-black-700)]">
                  <Icon
                    name={embedSnippet.embedSettingContent.icon}
                    size="md"
                  />
                  <Text>{embedSnippet.embedSettingContent.label}</Text>

                  <Tooltip
                    content={embedSnippet.embedSettingContent.tooltip}
                    placement="top"
                  >
                    <Icon className={`ml-1`} name={"question-fill"} size="md" />
                  </Tooltip>
                </div>
                <Link
                  kind="secondary"
                  target="_blank"
                  to="https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this"
                >
                  {createMessage(IN_APP_EMBED_SETTING.change)}
                </Link>
              </div>
            </div>
          )}

          <div
            className={classNames({
              "pt-2": !embedSnippet.isSuperUser,
              "pt-3.5": embedSnippet.isSuperUser,
            })}
          >
            <div className="flex justify-between items-center">
              <Switch
                data-cy="show-navigation-bar-toggle"
                defaultSelected={
                  embedSnippet.currentEmbedSetting?.showNavigationBar
                }
                onChange={() =>
                  embedSnippet.onChange({
                    showNavigationBar:
                      !embedSnippet.currentEmbedSetting.showNavigationBar,
                  })
                }
              >
                {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
              </Switch>
            </div>
          </div>

          <div className="flex justify-between pt-3.5">
            <Text className="self-center">
              {createMessage(IN_APP_EMBED_SETTING.embedSize)}
            </Text>
            <div className="flex gap-2">
              <DimensionsInput
                icon="w-line"
                onChange={(width: string) => embedSnippet.onChange({ width })}
                prefix="W"
                value={embedSnippet.currentEmbedSetting?.width}
              />
              <DimensionsInput
                icon="h-line"
                onChange={(height: string) => embedSnippet.onChange({ height })}
                prefix="H"
                value={embedSnippet.currentEmbedSetting?.height}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 pt-2">
          <EmbedCodeSnippet snippet={embedSnippet.snippet} />
        </div>
      </div>
      <div
        className={`flex justify-end border-t-2 mt-6 pt-5 border-[${Colors.GRAY_200}]`}
      >
        {/* TODO (tanvi): replace with Link*/}
        <StyledPreviewLink
          className="flex gap-1 items-center self-end"
          data-cy="preview-embed"
          href={embedSnippet.appViewEndPoint}
          target={"_blank"}
        >
          <Icon name="external-link-line" size="md" />
          <Text>{createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}</Text>
        </StyledPreviewLink>
      </div>
    </div>
  );
}

export default EmbedSnippetTab;
