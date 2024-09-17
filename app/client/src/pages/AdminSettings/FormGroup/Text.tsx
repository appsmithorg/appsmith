import { Text } from "@appsmith/ads";
import React from "react";
import { getSettings } from "selectors/settingsSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";

const TextWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
`;

export default function TextComponent({ setting }: SettingComponentProps) {
  const settingsConfig = useSelector(getSettings);
  const value = setting.name && settingsConfig && settingsConfig[setting.name];
  return (
    <FormGroup setting={setting}>
      {value && (
        <TextWrapper>
          <Text
            color="var(--ads-v2-color-fg-muted)"
            data-testid="admin-settings-text"
            renderAs="p"
          >
            {value}
          </Text>
        </TextWrapper>
      )}
    </FormGroup>
  );
}
