import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";
import { formValueSelector } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { connect } from "react-redux";

export function InputText(props: {
  label: string;
  value: string;
  isValid: boolean;
  validationMessage?: string;
  placeholder?: string;
  isRequired?: boolean;
  name: string;
  encrypted?: boolean;
  actionName: string;
}) {
  const { actionName, name, placeholder, label, isRequired } = props;
  const dataTreePath = actionPathFromName(actionName, name);

  return (
    <div style={{ width: "50vh", minHeight: "55px" }}>
      <FormLabel>
        {label} {isRequired && "*"}
      </FormLabel>
      <DynamicTextField
        name={name}
        placeholder={placeholder}
        showLightningMenu={false}
        dataTreePath={dataTreePath}
      />
    </div>
  );
}

class DynamicInputTextControl extends BaseControl<DynamicInputControlProps> {
  render() {
    const {
      validationMessage,
      propertyValue,
      isValid,
      label,
      placeholderText,
      configProperty,
      actionName,
    } = this.props;

    return (
      <InputText
        name={configProperty}
        label={label}
        value={propertyValue}
        isValid={isValid}
        validationMessage={validationMessage}
        placeholder={placeholderText}
        actionName={actionName}
      />
    );
  }

  getControlType(): ControlType {
    return "QUERY_DYNAMIC_INPUT_TEXT";
  }
}

export interface DynamicInputControlProps extends ControlProps {
  placeholderText: string;
  actionName: string;
}

const actionPathFromName = (actionName: string, name: string): string => {
  const ActionConfigStarts = "actionConfiguration.";
  let path = name;
  if (path.startsWith(ActionConfigStarts)) {
    path = "config." + path.substr(ActionConfigStarts.length);
  }
  return `${actionName}.${path}`;
};

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  return {
    actionName: actionName,
  };
};

export default connect(mapStateToProps)(DynamicInputTextControl);
