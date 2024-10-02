import React from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Text, TextType } from "@appsmith/ads-old";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

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

const VariableHeader = styled(Text)`
  background: var(--ads-v2-color-bg-subtle);
  padding: 8px 16px;
`;

const EXPECTED_VARIABLE = {
  type: "object",
  example:
    '{\n  "name":"{{ inputName.property }}",\n  "preference":"{{ dropdownName.property }}"\n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

interface VariableProps {
  // Name of the action to define the path to the config property
  actionName: string;
  // Theme to be used in CodeEditor
  theme: EditorTheme;
}

/**
 * Variable Editor is for writing Graphql variables using the Codemirror Editor which we use for JSON
 * @param props Props that are required by the CodeEditor to render the variable editor
 * @returns Component with Editor
 */
function VariableEditor(props: VariableProps) {
  return (
    <VariableWrapper className="t--graphql-variable-editor">
      <VariableHeader color={"var(--ads-v2-color-fg)"} type={TextType.H6}>
        Query variables
      </VariableHeader>
      <DynamicTextField
        border={CodeEditorBorder.NONE}
        borderLess
        dataTreePath={`${props.actionName}.config.pluginSpecifiedTemplates[1].value`}
        evaluatedPopUpLabel={"Query variables"}
        expected={EXPECTED_VARIABLE}
        height="100%"
        mode={EditorModes.JSON_WITH_BINDING}
        name="actionConfiguration.pluginSpecifiedTemplates[1].value"
        placeholder={`${EXPECTED_VARIABLE.example}\n\n\\\\Take widget inputs using {{ }}`}
        showLightningMenu={false}
        showLineNumbers
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme}
      />
    </VariableWrapper>
  );
}

export default VariableEditor;
