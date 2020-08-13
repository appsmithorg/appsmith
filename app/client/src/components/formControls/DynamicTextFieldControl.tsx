import React from "react";
import { formValueSelector, change } from "redux-form";
import { connect } from "react-redux";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import {
  EditorSize,
  EditorModes,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { AppState } from "reducers";
import styled from "styled-components";
import TemplateMenu from "pages/Editor/QueryEditor/TemplateMenu";
import { QUERY_BODY_FIELD } from "constants/QueryEditorConstants";
import { getPluginResponseTypes } from "selectors/entitiesSelector";

const Wrapper = styled.div`
  .dynamic-text-field {
    border-radius: 4px;
    border: 1px solid #d0d7dd;
    font-size: 14px;
    height: calc(100vh / 4);
  }

  && {
    .CodeMirror-lines {
      padding: 16px 20px;
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
    const { responseType } = this.props;
    const isNewQuery =
      new URLSearchParams(window.location.search).get("new") === "true";
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
            createTemplate={templateString => {
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
            theme={EditorTheme.DARK}
          />
        )}
      </Wrapper>
    );
  }
}

export interface DynamicTextFieldProps extends ControlProps {
  actionName: string;
  createTemplate: Function;
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
    dispatch(change(QUERY_EDITOR_FORM_NAME, QUERY_BODY_FIELD, template));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DynamicTextControl);
