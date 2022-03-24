import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import styled from "styled-components";
import { getBindingOrConfigPathsForPaginationControl } from "entities/Action/actionProperties";
import { PaginationSubComponent } from "components/formControls/utils";

export const FormControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 20vw;
  margin-right: 1rem;
`;

// using query dynamic input text for both so user can dynamically change these values.
const valueFieldConfig: any = {
  key: "value",
  controlType: "QUERY_DYNAMIC_INPUT_TEXT",
  placeholderText: "value",
};

const limitFieldConfig: any = {
  ...valueFieldConfig,
  placeholderText: "20",
};

const offsetFieldConfig: any = {
  ...valueFieldConfig,
  placeholderText: "0",
};

export function Pagination(props: {
  label: string;
  isValid: boolean;
  validationMessage?: string;
  placeholder?: string;
  isRequired?: boolean;
  name: string;
  disabled?: boolean;
  customStyles?: any;
  configProperty: string;
  formName: string;
  initialValue?: Record<string, string>;
}) {
  const { configProperty, customStyles, formName, initialValue, name } = props;

  const offsetPath = getBindingOrConfigPathsForPaginationControl(
    PaginationSubComponent.Offset,
    configProperty,
  );
  const limitPath = getBindingOrConfigPathsForPaginationControl(
    PaginationSubComponent.Limit,
    configProperty,
  );

  return (
    <div
      data-cy={name}
      style={{
        display: "flex",
      }}
    >
      {/*  form control for Limit field */}
      <FormControlContainer>
        <FormControl
          config={{
            ...limitFieldConfig,
            label: "Limit",
            customStyles,
            configProperty: limitPath,
            info: "Limits the number of rows returned.",
            initialValue:
              typeof initialValue === "object" ? initialValue.limit : null,
          }}
          formName={formName}
        />
      </FormControlContainer>

      {/*  form control for Offset field */}
      <FormControlContainer>
        <FormControl
          config={{
            ...offsetFieldConfig,
            label: "Offset",
            customStyles,
            configProperty: offsetPath,
            info: "No of rows that are skipped before starting to count.",
            initialValue:
              typeof initialValue === "object" ? initialValue.offset : null,
          }}
          formName={formName}
        />
      </FormControlContainer>
    </div>
  );
}

class PaginationControl extends BaseControl<PaginationControlProps> {
  render() {
    const {
      configProperty, // JSON path for the pagination data
      disabled,
      formName, // Name of the form, used by redux-form lib to store the data in redux store
      isValid,
      label,
      placeholderText,
      validationMessage,
    } = this.props;

    return (
      // pagination component
      <Pagination
        configProperty={configProperty}
        disabled={disabled}
        formName={formName}
        isValid={isValid}
        label={label}
        name={configProperty}
        placeholder={placeholderText}
        validationMessage={validationMessage}
      />
    );
  }

  getControlType(): ControlType {
    return "PAGINATION";
  }
}

export interface PaginationControlProps extends ControlProps {
  placeholderText: string;
  disabled?: boolean;
}

export default PaginationControl;
