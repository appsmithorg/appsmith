import {
  TextType,
  Text,
  Case,
  TooltipComponent,
  Classes,
} from "design-system-old";
import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Switch } from "design-system";
import useUpdateEmbedSnippet from "./EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "./EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "./EmbedSnippet/Snippet";
import TooltipWrapper from "./EmbedSnippet/TooltipWrapper";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import classNames from "classnames";
import { PopoverPosition } from "@blueprintjs/core";
import { Icon } from "design-system";

const StyledLink = styled.a`
  position: relative;
  top: 1px;
  :hover {
    text-decoration: none;
  }

  .${Classes.TEXT} {
    border-bottom: 1px solid ${Colors.GRAY_700};
  }
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
                    <Icon className={`ml-1`} name={"question-fill"} size="md" />
                  </TooltipComponent>
                </div>
                <StyledLink
                  href="https://docs.appsmith.com/getting-started/setup/instance-configuration/frame-ancestors#why-should-i-control-this"
                  target="_blank"
                >
                  <Text
                    case={Case.UPPERCASE}
                    color={Colors.GRAY_700}
                    type={TextType.BUTTON_SMALL}
                  >
                    {createMessage(IN_APP_EMBED_SETTING.change)}
                  </Text>
                </StyledLink>
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
            <Text className="self-center" type={TextType.P1}>
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
          <Text color={Colors.GRAY_700} type={TextType.P4}>
            {createMessage(IN_APP_EMBED_SETTING.previewEmbeddedApp)}
          </Text>
        </StyledPreviewLink>
      </div>
    </div>
  );
}

export default EmbedSnippetTab;
