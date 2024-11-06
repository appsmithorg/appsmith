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
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { AppState } from "ee/reducers";
import styled from "styled-components";
import {
  getPluginResponseTypes,
  getPluginNameFromId,
} from "ee/selectors/entitiesSelector";
import { actionPathFromName } from "components/formControls/utils";
import type { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { getSqlEditorModeFromPluginName } from "components/editorComponents/CodeEditor/sql/config";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { Flex } from "@appsmith/ads";

const Wrapper = styled.div`
  min-width: 380px;
  width: 100%;
  min-height: 200px;
  height: 100%;
  display: flex;
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
      isActionRedesignEnabled,
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
      <Wrapper className={`t--${configProperty} dynamic-text-field-control`}>
        <Flex flex="1">
          <DynamicTextField
            dataTreePath={dataTreePath}
            disabled={this.props.disabled}
            evaluatedPopUpLabel={this?.props?.label}
            evaluationSubstitutionType={evaluationSubstitutionType}
            height="100%"
            mode={mode}
            name={this.props.configProperty}
            placeholder={placeholderText}
            showLineNumbers={
              isActionRedesignEnabled || this.props.showLineNumbers
            }
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
          />
        </Flex>
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
  isActionRedesignEnabled: boolean;
}

const mapStateToProps = (state: AppState, props: DynamicTextFieldProps) => {
  const valueSelector = formValueSelector(
    props.formName || QUERY_EDITOR_FORM_NAME,
  );
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const responseTypes = getPluginResponseTypes(state);
  const pluginName = getPluginNameFromId(state, pluginId);
  const { release_actions_redesign_enabled } = selectFeatureFlags(state);

  return {
    actionName,
    pluginId,
    responseType: responseTypes[pluginId],
    pluginName,
    isActionRedesignEnabled: release_actions_redesign_enabled,
  };
};

export default connect(mapStateToProps)(DynamicTextControl);
