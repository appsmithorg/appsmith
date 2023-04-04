import React from "react";
import { formValueSelector } from "redux-form";
import { connect } from "react-redux";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import {
  EditorSize,
  EditorModes,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { QUERY_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import type { AppState } from "@appsmith/reducers";
import styled from "styled-components";
import { getPluginResponseTypes } from "selectors/entitiesSelector";
import { actionPathFromName } from "components/formControls/utils";
import type { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { getLineCommentString } from "components/editorComponents/CodeEditor/utils/codeComment";

const Wrapper = styled.div`
  min-width: 380px;
  max-width: 872px;
  .dynamic-text-field {
    border-radius: 4px;
    font-size: 14px;
    min-height: calc(100vh / 4);
  }

  && {
    .CodeMirror-lines {
      padding: 10px;
    }
  }
`;

interface DynamicTextControlState {
  showTemplateMenu: boolean;
}

class DynamicTextControl extends BaseControl<
  DynamicTextFieldProps,
  DynamicTextControlState
> {
  constructor(props: DynamicTextFieldProps) {
    super(props);

    this.state = {
      showTemplateMenu: true,
    };
  }

  getControlType(): ControlType {
    return "QUERY_DYNAMIC_TEXT";
  }

  render() {
    const {
      actionName,
      configProperty,
      evaluationSubstitutionType,
      placeholderText,
      responseType,
    } = this.props;
    const dataTreePath = actionPathFromName(actionName, configProperty);
    const mode =
      responseType === "TABLE"
        ? EditorModes.SQL_WITH_BINDING
        : EditorModes.JSON_WITH_BINDING;

    const lineCommentString = getLineCommentString(mode);

    return (
      <Wrapper className={`t--${configProperty}`}>
        <DynamicTextField
          className="dynamic-text-field"
          dataTreePath={dataTreePath}
          disabled={this.props.disabled}
          evaluatedPopUpLabel={this?.props?.label}
          evaluationSubstitutionType={evaluationSubstitutionType}
          lineCommentString={lineCommentString}
          mode={mode}
          name={this.props.configProperty}
          placeholder={placeholderText}
          showLineNumbers={this.props.showLineNumbers}
          size={EditorSize.EXTENDED}
          tabBehaviour={TabBehaviour.INDENT}
        />
      </Wrapper>
    );
  }
}

export interface DynamicTextFieldProps extends ControlProps {
  actionName: string;
  pluginId: string;
  responseType: string;
  placeholderText?: string;
  evaluationSubstitutionType: EvaluationSubstitutionType;
  mutedHinting?: boolean;
}

const mapStateToProps = (state: AppState, props: DynamicTextFieldProps) => {
  const valueSelector = formValueSelector(
    props.formName || QUERY_EDITOR_FORM_NAME,
  );
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const responseTypes = getPluginResponseTypes(state);

  return {
    actionName,
    pluginId,
    responseType: responseTypes[pluginId],
  };
};

export default connect(mapStateToProps)(DynamicTextControl);
