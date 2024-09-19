import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import React from "react";
import { Button } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import { FormGroup, type SettingComponentProps } from "./Common";

const ButtonWrapper = styled.div`
  width: 357px;

  .styled-label {
    padding: 0 0 0.5rem;
  }

  .admin-settings-form-group-label {
    font-weight: var(--ads-v2-h5-font-weight);
  }
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
      <FormGroup setting={setting}>
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
      </FormGroup>
    </ButtonWrapper>
  );
}
