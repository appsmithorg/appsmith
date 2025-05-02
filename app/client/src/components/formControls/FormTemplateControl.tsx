import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import styled from "styled-components";
import { Button, Flex } from "@appsmith/ads";
import type { ButtonProps } from "@appsmith/ads";
import { change, getFormValues } from "redux-form";
import { connect } from "react-redux";
import { get, omit } from "lodash";
import type { DefaultRootState } from "react-redux";
import type { Action } from "entities/Action";

const StyledButton = styled((props: ButtonProps & { isActive: boolean }) => (
  <Button {...omit(props, ["isActive"])} />
))`
  // The active state of the button has an undefined border color
  // This results in a change in the button size and causes a layout shift
  // so setting it to the default color
  &:active:not([data-disabled="true"]):not([data-loading="true"]) {
    --button-color-border: var(
      --ads-v2-colors-action-secondary-surface-default-border
    );
  }

  ${({ isActive }) =>
    isActive &&
    `
    --button-color-bg: var(--ads-v2-colors-action-secondary-surface-active-bg);
    --button-color-fg: var(--ads-v2-colors-action-secondary-label-default-fg);
    --button-color-border: var(
      --ads-v2-colors-action-secondary-surface-default-border
    );
  `}
`;

export interface FormTemplateControlProps extends ControlProps {
  options: FormTemplateOption[];
}

interface FormTemplateOption {
  label: string;
  value: {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

interface ReduxDispatchProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFormProperty: (formName: string, field: string, value: any) => void;
}

interface ReduxStateProps {
  formValues: Partial<Action>;
}

interface FormTemplatePartialProps {
  label: string;
  isValid: boolean;
  validationMessage?: string;
  isRequired?: boolean;
  name: string;
  disabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customStyles?: any;
  configProperty: string;
  formName: string;
  initialValue?: Record<string, string>;
  options: FormTemplateOption[];
}

type FormTemplateProps = FormTemplatePartialProps &
  ReduxDispatchProps &
  ReduxStateProps;

export function FormTemplate(props: FormTemplateProps) {
  const { formName, formValues, options, updateFormProperty } = props;

  const isActive = (option: FormTemplateOption) => {
    // Checks if the option is active
    // An option is active if all the values in the option value are equal to the form values
    const { value } = option;

    return Object.keys(value).every((key) => {
      return get(formValues, key) === value[key];
    });
  };

  const onClick = (option: FormTemplateOption) => {
    // Updates the form values with the option value
    const { value } = option;

    Object.keys(value).forEach((key) => {
      updateFormProperty(formName, key, value[key]);
    });
  };

  return (
    <Flex gap="spaces-2">
      {options.map((option) => (
        <StyledButton
          data-active={isActive(option)}
          isActive={isActive(option)}
          key={option.label}
          kind="secondary"
          onClick={() => onClick(option)}
          size="sm"
        >
          {option.label}
        </StyledButton>
      ))}
    </Flex>
  );
}

class FormTemplateControl extends BaseControl<
  FormTemplateControlProps & ReduxDispatchProps & ReduxStateProps
> {
  render() {
    const {
      configProperty,
      disabled,
      formName,
      formValues,
      isValid,
      label,
      options,
      updateFormProperty,
    } = this.props;

    return (
      <FormTemplate
        configProperty={configProperty}
        disabled={disabled}
        formName={formName}
        formValues={formValues}
        isValid={isValid}
        label={label}
        name={configProperty}
        options={options}
        updateFormProperty={updateFormProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "FORM_TEMPLATE";
  }
}

const mapStateToProps = (
  state: DefaultRootState,
  ownProps: FormTemplateControlProps,
): ReduxStateProps => {
  const formValues: Partial<Action> = getFormValues(ownProps.formName)(state);

  return { formValues };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFormProperty: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(FormTemplateControl);
