import React from "react";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esnext/common";
import { Text, TextType } from "components/ads";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

const VariableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0;
  border-left: 1px solid var(--appsmith-color-black-250);
`;

const VariableHeader = styled.div`
  display: flex;
  width: 100%;
  background: ${Colors.GREY_2};
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
function VariableEditor(props: VariableProps) {
  return (
    <VariableWrapper>
      <VariableHeader>
        <TooltipComponent
          content="Add your query variables here!"
          hoverOpenDelay={300}
          position={Position.BOTTOM_LEFT}
        >
          <Text color={Colors.GRAY_700} type={TextType.H6}>
            Query Variables
          </Text>
        </TooltipComponent>
      </VariableHeader>
      <DynamicTextField
        border={CodeEditorBorder.ALL_SIDE}
        dataTreePath={`${props.actionName}.config.variable`}
        expected={EXPECTED_VARIABLE}
        height="100%"
        mode={EditorModes.JSON_WITH_BINDING}
        name="actionConfiguration.variable"
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
