import Button, { Category } from "components/ads/Button";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";

const ButtonWrapper = styled.div`
  width: 357px;
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
  margin-top: 3px;
`;

const StyledButton = styled(Button)`
  height: 30px;
  display: inline-block;
  padding: 7px 16px;
`;

export default function ButtonComponent({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  return (
    <FormGroup setting={setting}>
      <ButtonWrapper>
        <StyledButton
          category={Category.tertiary}
          data-testid="admin-settings-button"
          onClick={() => {
            if (setting.action) {
              setting.action(dispatch);
            }
          }}
          text={setting.text}
          type="button"
        />
      </ButtonWrapper>
    </FormGroup>
  );
}
