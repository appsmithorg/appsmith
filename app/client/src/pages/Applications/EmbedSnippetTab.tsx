import React from "react";
import { Colors } from "constants/Colors";
import useUpdateEmbedSnippet from "./EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "./EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "./EmbedSnippet/Snippet";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import classNames from "classnames";
import { Icon, Link, Switch, Text, Tooltip } from "design-system";

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
                  <Text kind="action-m">
                    {embedSnippet.embedSettingContent.label}
                  </Text>

                  <Tooltip
                    content={embedSnippet.embedSettingContent.tooltip}
                    placement="top"
                  >
                    <Icon className={`ml-1`} name={"question-fill"} size="md" />
                  </Tooltip>
                </div>
                <Link
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
                className="mb-0"
                data-cy={"show-navigation-bar-toggle"}
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
            <Text className="self-center" kind="action-m">
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
        <div className="flex gap-1 items-center">
          <Link
            data-cy="preview-embed"
            endIcon="share-box-line"
            kind="secondary"
            target={"_blank"}
            to={embedSnippet.appViewEndPoint}
          >
            {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EmbedSnippetTab;
