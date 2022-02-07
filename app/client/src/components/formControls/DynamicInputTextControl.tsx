import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AppState } from "reducers";
import { formValueSelector } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { connect } from "react-redux";
import { actionPathFromName } from "components/formControls/utils";
import {
  EditorModes,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import _ from "lodash";
import { Colors } from "constants/Colors";

// Enum for the different types of input fields
export enum INPUT_TEXT_INPUT_TYPES {
  TEXT = "TEXT",
  PASSWORD = "PASSWORD",
  JSON = "JSON",
}

const StyledDynamicTextField = styled(DynamicTextField)`
  .CodeEditorTarget .CodeMirror.CodeMirror-wrap {
    background-color: ${Colors.WHITE};
  }
  .CodeEditorTarget .CodeMirror.CodeMirror-wrap:hover {
    background-color: ${Colors.ALABASTER_ALT};
  }
  &&& .t--code-editor-wrapper {
    border: none;
  }
`;

// Functional component for the DYNAMIC_INPUT_TEXT_CONTROL
export function InputText(props: {
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  name: string;
  actionName: string;
  inputType?: INPUT_TEXT_INPUT_TYPES;
  customStyles?: any;
  disabled?: boolean;
}) {
  const { actionName, inputType, name, placeholder } = props;
  const dataTreePath = actionPathFromName(actionName, name);
  let editorProps = {};

  // Set the editor props to enable JSON editing experience
  if (!!inputType && inputType === INPUT_TEXT_INPUT_TYPES.JSON) {
    editorProps = {
      mode: EditorModes.JSON,
      size: EditorSize.EXTENDED,
    };
  }

  let customStyle = { width: "20vw", minHeight: "38px" };
  if (!!props.customStyles && _.isEmpty(props.customStyles) === false) {
    customStyle = { ...props.customStyles };
    if ("width" in props.customStyles) {
      customStyle.width = props.customStyles.width;
    }
    if ("minHeight" in props.customStyles) {
      customStyle.minHeight = props.customStyles.minHeight;
    }
  }
  return (
    <div style={customStyle}>
      <StyledDynamicTextField
        dataTreePath={dataTreePath}
        disabled={props.disabled}
        name={name}
        placeholder={placeholder}
        showLightningMenu={false}
        {...editorProps}
      />
    </div>
  );
}

// This is a custom control that is used for dynamic input text fields in the forms for datsources and queries
class DynamicInputTextControl extends BaseControl<DynamicInputControlProps> {
  render() {
    const {
      actionName,
      configProperty,
      customStyles,
      disabled,
      inputType,
      label,
      placeholderText,
    } = this.props;

    let inputTypeProp = inputType;
    if (!inputType) {
      inputTypeProp = INPUT_TEXT_INPUT_TYPES.TEXT;
    }

    return (
      <InputText
        actionName={actionName}
        customStyles={customStyles}
        disabled={disabled}
        inputType={inputTypeProp}
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
  inputType?: INPUT_TEXT_INPUT_TYPES;
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
