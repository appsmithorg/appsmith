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
import {
  getPluginResponseTypes,
  getPluginNameFromId,
} from "@appsmith/selectors/entitiesSelector";
import { actionPathFromName } from "components/formControls/utils";
import type { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { getSqlEditorModeFromPluginName } from "components/editorComponents/CodeEditor/sql/config";

const Wrapper = styled.div`
  min-width: 380px;
  max-width: 872px;
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
      pluginName,
      responseType,
    } = this.props;
    const dataTreePath = actionPathFromName(actionName, configProperty);
    const mode =
      responseType === "TABLE"
        ? getSqlEditorModeFromPluginName(pluginName)
        : EditorModes.JSON_WITH_BINDING;

    return (
      <Wrapper className={`t--${configProperty}`}>
        <DynamicTextField
          dataTreePath={dataTreePath}
          disabled={this.props.disabled}
          evaluatedPopUpLabel={this?.props?.label}
          evaluationSubstitutionType={evaluationSubstitutionType}
          height="calc(100vh / 4)"
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
  pluginName: string;
}

const mapStateToProps = (state: AppState, props: DynamicTextFieldProps) => {
  const valueSelector = formValueSelector(
    props.formName || QUERY_EDITOR_FORM_NAME,
  );
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const responseTypes = getPluginResponseTypes(state);
  const pluginName = getPluginNameFromId(state, pluginId);

  return {
    actionName,
    pluginId,
    responseType: responseTypes[pluginId],
    pluginName,
  };
};

export default connect(mapStateToProps)(DynamicTextControl);
