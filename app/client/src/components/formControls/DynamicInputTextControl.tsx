import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";
import { formValueSelector } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { connect } from "react-redux";
import { actionPathFromName } from "components/formControls/utils";

export function InputText(props: {
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  name: string;
  actionName: string;
}) {
  const { actionName, isRequired, label, name, placeholder } = props;
  const dataTreePath = actionPathFromName(actionName, name);

  return (
    <div style={{ width: "50vh", minHeight: "55px" }}>
      <FormLabel>
        {label} {isRequired && "*"}
      </FormLabel>
      <DynamicTextField
        dataTreePath={dataTreePath}
        name={name}
        placeholder={placeholder}
        showLightningMenu={false}
      />
    </div>
  );
}

class DynamicInputTextControl extends BaseControl<DynamicInputControlProps> {
  render() {
    const { actionName, configProperty, label, placeholderText } = this.props;

    return (
      <InputText
        actionName={actionName}
        label={label}
        name={configProperty}
        placeholder={placeholderText}
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

const mapStateToProps = (state: AppState, props: DynamicInputControlProps) => {
  const valueSelector = formValueSelector(
    props.formName || QUERY_EDITOR_FORM_NAME,
  );
  const actionName = valueSelector(state, "name");
  return {
    actionName: actionName,
  };
};

export default connect(mapStateToProps)(DynamicInputTextControl);
