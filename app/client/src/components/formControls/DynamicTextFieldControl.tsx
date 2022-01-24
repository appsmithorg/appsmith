import React from "react";
import { formValueSelector, change } from "redux-form";
import { connect } from "react-redux";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import {
  EditorSize,
  EditorModes,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import styled from "styled-components";
import TemplateMenu from "pages/Editor/QueryEditor/TemplateMenu";
import { QUERY_BODY_FIELD } from "constants/QueryEditorConstants";
import { getPluginResponseTypes } from "selectors/entitiesSelector";
import history from "utils/history";
import {
  convertObjectToQueryParams,
  getQueryParams,
} from "utils/AppsmithUtils";
import { actionPathFromName } from "components/formControls/utils";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

const Wrapper = styled.div`
  width: 75%;
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
    const isNewQuery =
      new URLSearchParams(window.location.search).get("showTemplate") ===
      "true";
    const showTemplate =
      isNewQuery && this.state.showTemplateMenu && this.props.pluginId;
    const mode =
      responseType === "TABLE"
        ? EditorModes.SQL_WITH_BINDING
        : EditorModes.JSON_WITH_BINDING;

    return (
      <Wrapper>
        {showTemplate ? (
          <TemplateMenu
            createTemplate={(templateString) => {
              this.setState(
                {
                  showTemplateMenu: false,
                },
                () =>
                  this.props.createTemplate(
                    templateString,
                    this.props.formName,
                  ),
              );
            }}
            pluginId={this.props.pluginId}
          />
        ) : (
          <DynamicTextField
            className="dynamic-text-field"
            dataTreePath={dataTreePath}
            disabled={this.props.disabled}
            evaluationSubstitutionType={evaluationSubstitutionType}
            mode={mode}
            name={this.props.configProperty}
            placeholder={placeholderText}
            size={EditorSize.EXTENDED}
            tabBehaviour={TabBehaviour.INDENT}
          />
        )}
      </Wrapper>
    );
  }
}

export interface DynamicTextFieldProps extends ControlProps {
  actionName: string;
  createTemplate: (template: any, formName: string) => any;
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

const mapDispatchToProps = (dispatch: any) => ({
  createTemplate: (template: any, formName: string) => {
    const params = getQueryParams();
    if (params.showTemplate) {
      params.showTemplate = "false";
    }
    history.replace({
      ...window.location,
      search: convertObjectToQueryParams(params),
    });
    dispatch(
      change(formName || QUERY_EDITOR_FORM_NAME, QUERY_BODY_FIELD, template),
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DynamicTextControl);
