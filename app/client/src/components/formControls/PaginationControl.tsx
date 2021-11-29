import React, { useState } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import FormControl from "pages/Editor/FormControl";
import { Field } from "redux-form";
import TextField from "components/editorComponents/form/fields/TextField";
import FormLabel from "components/editorComponents/FormLabel";
import { FormIcons } from "icons/FormIcons";
import { Colors } from "constants/Colors";
import styled, { css } from "styled-components";
import { InputType } from "components/constants";
import RadioGroupWrapper from "components/editorComponents/form/fields/RadioGroupWrapper";

export const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;

  ${(props: { extraText?: boolean }) =>
    props.extraText &&
    css`
      text-transform: uppercase;
      color: ${Colors.DANUBE};
      font-weight: 500;
      letter-spacing: 0.8px;
      line-height: 14px;
    `}
`;

export const StyledFormLabel = styled(FormLabel)`
  margin-bottom: 0px;
`;

export const StyledFormLabelFooter = styled(FormLabel)`
  margin-top: 5px;
  font-weight: 400;
  font-size: 12px;
  color: ${Colors.GREY_7};
  line-height: 16px;
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

export const FormRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;

  ${(props: { noMarginBottom?: boolean }) =>
    props.noMarginBottom &&
    css`
      margin-bottom: 0px;
    `}
`;

export const FormControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

export const FormIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
`;

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
  value: string;
  isValid: boolean;
  subtitle?: string;
  validationMessage?: string;
  placeholder?: string;
  extraText?: string;
  isRequired?: boolean;
  name: string;
  disabled?: boolean;
  customStyles: any;
  configProperty: string;
  formName: string;
  expected: any;
}) {
  const {
    configProperty,
    customStyles,
    disabled,
    expected,
    extraText,
    formName,
    isRequired,
    label,
    name,
    subtitle,
  } = props;

  const [startAt, setStartAt] = useState("");
  // eslint-disable-next-line no-console
  console.log(startAt);

  return (
    <div data-cy={name} style={{ width: "50vh" }}>
      <FormContainer>
        <FormRow>
          <StyledFormLabel>{label}</StyledFormLabel>
          <FormIconContainer>
            <FormIcons.HELP_ICON height={16} keepColors width={16} />
          </FormIconContainer>
        </FormRow>
        <FormRow>
          {subtitle && (
            <>
              <br />
              <StyledInfo>{subtitle}</StyledInfo>
            </>
          )}
        </FormRow>
        <FormRow noMarginBottom>
          {extraText && (
            <>
              <br />
              <StyledInfo extraText>{extraText}</StyledInfo>
            </>
          )}
        </FormRow>
      </FormContainer>
      <FormControlContainer>
        <FormControl
          config={{
            ...limitFieldConfig,
            label: "Limit",
            customStyles,
            configProperty: `${configProperty}.limit`,
            expected,
          }}
          formName={formName}
        />
        <StyledFormLabelFooter>
          Limits the number of rows returned.
        </StyledFormLabelFooter>
      </FormControlContainer>

      <FormControlContainer>
        <FormControl
          config={{
            ...offsetFieldConfig,
            label: "Offset",
            customStyles,
            configProperty: `${configProperty}.offset`,
          }}
          formName={formName}
        />
        <StyledFormLabelFooter>
          No of rows that are skipped before starting to count.
        </StyledFormLabelFooter>
      </FormControlContainer>

      {/* <FormContainer>
        <FormLabel> Start Offset </FormLabel>
        <Field
          component={RadioGroupWrapper}
          name={`${configProperty}.startOffset.startPosition`}
          props={{
            options: [
              { value: "startAt", label: "startAt" },
              { value: "startAfter", label: "startAfter" },
            ],
            placeholder: "radios",
            input: {
              onChange: (value: { value: string }) => setStartAt(value.value),
              value: startAt,
            },
            columns: 2,
          }}
          rerenderOnEveryChange={false}
        />
        <FormControl
          config={{
            ...limitFieldConfig,
            customStyles,
            configProperty: `${configProperty}.startOffset.defaultValue`,
          }}
          formName={formName}
        />
        <StyledFormLabelFooter>
          Limits the number of rows returned.
        </StyledFormLabelFooter>
      </FormContainer> */}
    </div>
  );
}

class PaginationControl extends BaseControl<PaginationControlProps> {
  render() {
    const {
      configProperty, // JSON path for the pagination data
      dataType,
      disabled,
      extraText,
      isValid,
      label,
      placeholderText,
      propertyValue,
      subtitle,
      validationMessage, // Name of the form, used by redux-form lib to store the data in redux store
    } = this.props;

    const customStyles = {
      marginTop: "1px",
    };

    return (
      // switch back to normal component
      //   <Pagination
      //     dataType={this.getType(dataType)}
      //     disabled={disabled}
      //     encrypted={this.props.encrypted}
      //     formName={formName}
      //     isValid={isValid}
      //     label={label}
      //     name={configProperty}
      //     placeholder={placeholderText}
      //     subtitle={subtitle}
      //     validationMessage={validationMessage}
      //     value={propertyValue}
      //   />
      <Field
        component={Pagination}
        name={configProperty}
        props={{
          isValid,
          label,
          placeholderText,
          propertyValue,
          subtitle,
          validationMessage,
          disabled,
          dataType,
          extraText,
          //   customStyles,
          configProperty,
        }}
        rerenderOnEveryChange={false}
      />
    );
  }

  getControlType(): ControlType {
    return "PAGINATION";
  }
}

export interface PaginationControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  subtitle?: string;
  extraText?: string;
  encrypted?: boolean;
  disabled?: boolean;
}

export default PaginationControl;
