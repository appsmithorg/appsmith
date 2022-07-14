import { Text, TextType } from "design-system";
import React from "react";
import { getSettings } from "selectors/settingsSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";

const TextWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
`;

const StyledText = styled(Text)`
  color: ${(props) => props.theme.colors.settings.link};
`;

export default function TextComponent({ setting }: SettingComponentProps) {
  const settingsConfig = useSelector(getSettings);
  const value = setting.name && settingsConfig && settingsConfig[setting.name];
  return (
    <FormGroup setting={setting}>
      {value && (
        <TextWrapper>
          <StyledText data-testid="admin-settings-text" type={TextType.P1}>
            {value}
          </StyledText>
        </TextWrapper>
      )}
    </FormGroup>
  );
}
