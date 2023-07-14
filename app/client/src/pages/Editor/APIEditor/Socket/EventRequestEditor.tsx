import React from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Text, TextType } from "design-system-old";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { Button } from "design-system";

const VariableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0;
  &&&&& .CodeMirror {
    border: 0px;
  }
  &&& .CodeMirror-gutters {
    background: var(--ads-v2-color-bg-subtle);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 20px;
  justify-content: center;
`;

const VariableHeader = styled.div`
  display: flex;
  width: 100%;
  background: var(--ads-v2-color-bg-subtle);
  padding: 8px 16px;
`;

const EXPECTED_VARIABLE = {
  type: "object",
  example:
    '{\n  "name":"{{ inputName.property }}",\n  "preference":"{{ dropdownName.property }}"\n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

type VariableProps = {
  // Name of the action to define the path to the config property
  actionName: string;
  // Theme to be used in CodeEditor
  theme: EditorTheme;
};

/**
 * Variable Editor is for writing Graphql variables using the Codemirror Editor which we use for JSON
 * @param props Props that are required by the CodeEditor to render the variable editor
 * @returns Component with Editor
 */
function EventRequestEditor(props: VariableProps) {
  return (
    <VariableWrapper className="t--graphql-variable-editor">
      <VariableHeader>
        <Text color={"var(--ads-v2-color-fg)"} type={TextType.H6}>
          Send Events
        </Text>
      </VariableHeader>
      <DynamicTextField
        border={CodeEditorBorder.NONE}
        borderLess
        dataTreePath={`${props.actionName}.config.pluginSpecifiedTemplates[2].value`}
        evaluatedPopUpLabel={"Query variables"}
        expected={EXPECTED_VARIABLE}
        height="90%"
        mode={EditorModes.JSON_WITH_BINDING}
        name="actionConfiguration.pluginSpecifiedTemplates[2].value"
        placeholder={`${EXPECTED_VARIABLE.example}\n\n\\\\Take widget inputs using {{ }}`}
        showLightningMenu={false}
        showLineNumbers
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme}
      />

      <ButtonContainer>
        <Button kind="primary" size={"md"}>
          {" "}
          Post event
        </Button>
      </ButtonContainer>
    </VariableWrapper>
  );
}

export default EventRequestEditor;
