import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import React from "react";
import { Button, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";

const ButtonWrapper = styled.div`
  width: 357px;
  margin-bottom: 8px;
`;

export const StyledButton = styled(Button)`
  display: inline-block;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export default function ButtonComponent({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  const settings = useSelector(formValuesSelector);
  return (
    <ButtonWrapper>
      <Text
        className="admin-settings-form-group-label pb-2"
        color="var(--ads-v2-color-fg)"
        data-testid="admin-settings-form-group-label"
        kind="heading-xs"
        renderAs="p"
      >
        {setting.label}
      </Text>
      <StyledButton
        data-testid="admin-settings-button"
        isDisabled={setting.isDisabled && setting.isDisabled(settings)}
        kind="secondary"
        onClick={() => {
          if (setting.action) {
            setting.action(dispatch, settings);
          }
        }}
        size="md"
      >
        {setting.text}
      </StyledButton>
    </ButtonWrapper>
  );
}
