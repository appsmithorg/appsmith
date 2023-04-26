import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import React from "react";
import { Button } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";

const ButtonWrapper = styled.div`
  width: 357px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  margin-top: 3px;
`;

export const StyledButton = styled(Button)`
  display: inline-block;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export default function ButtonComponent({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  const settings = useSelector(formValuesSelector);
  return (
    <FormGroup setting={setting}>
      <ButtonWrapper>
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
    </FormGroup>
  );
}
