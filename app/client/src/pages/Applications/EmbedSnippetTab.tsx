import {
  IconSize,
  TextType,
  Text,
  Switch,
  Case,
  TooltipComponent,
  Classes,
  Icon,
} from "design-system";
import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import SwitchWrapper from "pages/Editor/AppSettingsPane/Components/SwitchWrapper";
import useUpdateEmbedSnippet from "./EmbedSnippet/useUpdateEmbedSnippet";
import DimensionsInput from "./EmbedSnippet/DimensionsInput";
import EmbedCodeSnippet from "./EmbedSnippet/Snippet";
import TooltipWrapper from "./EmbedSnippet/TooltipWrapper";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";

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

function EmbedSnippetTab() {
  const embedSnippet = useUpdateEmbedSnippet();
  return (
    <div className="flex gap-3">
      <div className="flex flex-1 flex-col">
        {embedSnippet.isSuperUser && (
          <div>
            <div className="flex justify-between items-center pb-2">
              <div className="flex items-center gap-1 pt-0.5 text-[color:var(--appsmith-color-black-700)]">
                <Icon
                  name={embedSnippet.embedSettingContent.icon}
                  size={IconSize.XXL}
                />
                <Text type={TextType.P1}>
                  {embedSnippet.embedSettingContent.label}
                </Text>

                <TooltipComponent
                  content={
                    <TooltipWrapper>
                      {embedSnippet.embedSettingContent.tooltip}
                    </TooltipWrapper>
                  }
                >
                  <Icon
                    className={`ml-1`}
                    fillColor={Colors.GRAY2}
                    name={"question-fill"}
                    size={IconSize.XL}
                  />
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

        <div className="pt-3.5">
          <div className="flex justify-between content-center pb-2">
            <Text type={TextType.P1}>
              {createMessage(IN_APP_EMBED_SETTING.showNavigationBar)}
            </Text>
            <SwitchWrapper>
              <Switch
                className="mb-0"
                defaultChecked={
                  embedSnippet.currentEmbedSetting?.showNavigationBar
                }
                large
                onChange={() =>
                  embedSnippet.onChange({
                    showNavigationBar: !embedSnippet.currentEmbedSetting
                      .showNavigationBar,
                  })
                }
              />
            </SwitchWrapper>
          </div>
        </div>

        <div className="flex pt-3.5 justify-between">
          <Text className="self-center" type={TextType.P1}>
            {createMessage(IN_APP_EMBED_SETTING.embedSize)}
          </Text>
          <div className="flex gap-2 pt-1 pb-2">
            <DimensionsInput
              onChange={(width: string) => embedSnippet.onChange({ width })}
              prefix="W"
              value={embedSnippet.currentEmbedSetting?.width}
            />
            <DimensionsInput
              onChange={(height: string) => embedSnippet.onChange({ height })}
              prefix="H"
              value={embedSnippet.currentEmbedSetting?.height}
            />
          </div>
        </div>
      </div>

      <EmbedCodeSnippet snippet={embedSnippet.snippet} />
    </div>
  );
}

export default EmbedSnippetTab;
