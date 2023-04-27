import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { createMessage } from "@appsmith/constants/messages";
import { Switch, Text } from "design-system";

const ToggleWrapper = styled.div`
  margin-bottom: 16px;
`;

const ToggleStatus = styled(Text)``;

function FieldToggleWithToggleText(
  toggleText?: (value: boolean) => string,
  id?: string,
  isPropertyDisabled?: boolean,
  label?: string,
) {
  return function FieldToggle(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    const val = componentProps.input.value;

    function onToggle(value?: boolean) {
      const toggleValue = isPropertyDisabled ? !value : value;
      componentProps.input.onChange &&
        componentProps.input.onChange(toggleValue);
      componentProps.input.onBlur && componentProps.input.onBlur(toggleValue);
    }
    /* Value = !ENV_VARIABLE
    This has been done intentionally as naming convention used contains the word disabled but the UI should show the button enabled by default.
    */

    //TODO: This should be refactored to utilize the functionality of the switch component for state
    return (
      <ToggleWrapper>
        <Switch
          data-cy={id}
          isSelected={isPropertyDisabled ? !val : val}
          onChange={onToggle}
        >
          <ToggleStatus>
            {typeof toggleText == "function"
              ? createMessage(() => toggleText(val))
              : val
              ? createMessage(() => `${label ? `${label} Enabled` : "Enabled"}`)
              : createMessage(
                  () => `${label ? `${label} Disabled` : "Disabled"}`,
                )}
          </ToggleStatus>
        </Switch>
      </ToggleWrapper>
    );
  };
}

const StyledFieldToggleGroup = styled.div`
  margin-bottom: 8px;
`;

export function ToggleComponent({ setting }: SettingComponentProps) {
  return (
    <StyledFieldToggleGroup>
      <FormGroup
        className="t--admin-settings-toggle"
        isToggle
        setting={setting}
      >
        <Field
          component={FieldToggleWithToggleText(
            setting.toggleText,
            setting.id,
            !setting.name?.toLowerCase().includes("enable"),
            setting.label,
          )}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
