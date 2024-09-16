import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import type { AppState } from "ee/reducers";
import { formValueSelector } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { connect } from "react-redux";
import { actionPathFromName } from "components/formControls/utils";
import {
  EditorModes,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import _ from "lodash";

// Enum for the different types of input fields
export enum INPUT_TEXT_INPUT_TYPES {
  TEXT = "TEXT",
  PASSWORD = "PASSWORD",
  JSON = "JSON",
  TEXT_WITH_BINDING = "TEXT_WITH_BINDING",
}

const StyledDynamicTextField = styled(DynamicTextField)`
  .CodeEditorTarget .CodeMirror.CodeMirror-wrap {
    background-color: var(--ads-v2-color-bg);
  }
  .CodeEditorTarget .CodeMirror.CodeMirror-wrap:hover {
    background-color: var(--ads-v2-color-bg);
    border-color: var(--ads-v2-color-border-emphasis);
  }
  &&& .t--code-editor-wrapper {
    border: none;
  }
  .CodeEditorTarget {
    border-radius: var(--ads-v2-border-radius);
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customStyles?: any;
  disabled?: boolean;
  showLineNumbers?: boolean;
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

  // Set the editor props to enable JSON editing experience
  if (!!inputType && inputType === INPUT_TEXT_INPUT_TYPES.TEXT_WITH_BINDING) {
    editorProps = {
      mode: EditorModes.TEXT_WITH_BINDING,
      size: EditorSize.EXTENDED,
    };
  }

  let customStyle = { width: "270px", minHeight: "36px" };
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
    <div
      className={`t--${props?.name} uqi-dynamic-input-text`}
      style={customStyle}
    >
      {/* <div style={customStyle}> */}
      <StyledDynamicTextField
        dataTreePath={dataTreePath}
        disabled={props.disabled}
        evaluatedPopUpLabel={props?.label || ""}
        name={name}
        placeholder={placeholder}
        showLightningMenu={false}
        showLineNumbers={props.showLineNumbers}
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
      showLineNumbers,
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
        showLineNumbers={showLineNumbers}
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
