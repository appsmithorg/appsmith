import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import React from "react";
import { Button, Category } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getFormValues } from "redux-form";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";

const ButtonWrapper = styled.div`
  width: 357px;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  margin-top: 3px;
`;

export const StyledButton = styled(Button)`
  height: 30px;
  display: inline-block;
  padding: 7px 16px;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export default function ButtonComponent({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  const settings = useSelector(formValuesSelector);
  return (
    <FormGroup setting={setting}>
      <ButtonWrapper>
        <StyledButton
          category={Category.secondary}
          data-testid="admin-settings-button"
          disabled={setting.isDisabled && setting.isDisabled(settings)}
          onClick={() => {
            if (setting.action) {
              setting.action(dispatch, settings);
            }
          }}
          tag="button"
          text={setting.text}
          type="button"
        />
      </ButtonWrapper>
    </FormGroup>
  );
}
