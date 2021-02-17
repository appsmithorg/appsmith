import React from "react";
import { formValueSelector, change } from "redux-form";
import { connect } from "react-redux";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
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

const Wrapper = styled.div`
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
    const { responseType, label } = this.props;
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
        <FormLabel>{label}</FormLabel>
        {showTemplate ? (
          <TemplateMenu
            createTemplate={(templateString) => {
              this.setState(
                {
                  showTemplateMenu: false,
                },
                () => this.props.createTemplate(templateString),
              );
            }}
            pluginId={this.props.pluginId}
          />
        ) : (
          <DynamicTextField
            size={EditorSize.EXTENDED}
            name={this.props.configProperty}
            dataTreePath={`${this.props.actionName}.config.body`}
            className="dynamic-text-field"
            mode={mode}
            tabBehaviour={TabBehaviour.INDENT}
          />
        )}
      </Wrapper>
    );
  }
}

export interface DynamicTextFieldProps extends ControlProps {
  actionName: string;
  createTemplate: (template: any) => any;
  pluginId: string;
  responseType: string;
}

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
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
  createTemplate: (template: any) => {
    const params = getQueryParams();
    if (params.showTemplate) {
      params.showTemplate = "false";
    }
    history.replace({
      ...window.location,
      search: convertObjectToQueryParams(params),
    });
    dispatch(change(QUERY_EDITOR_FORM_NAME, QUERY_BODY_FIELD, template));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DynamicTextControl);
