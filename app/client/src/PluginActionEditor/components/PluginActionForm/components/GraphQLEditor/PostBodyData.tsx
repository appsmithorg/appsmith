import React from "react";
import styled from "styled-components";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { Section, Zone } from "../ActionForm";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import FormLabel from "components/editorComponents/FormLabel";

const PostBodyContainer = styled.div`
  &&&& .CodeMirror {
    height: auto;
    min-height: 250px;
  }
`;

const StyledFormLabel = styled(FormLabel)`
  && {
    margin-bottom: var(--ads-v2-spaces-2);
    padding: 0;
  }
`;

interface Props {
  actionName: string;
}

const EXPECTED_VARIABLE = {
  type: "object",
  example:
    '{\n  "name":"{{ inputName.property }}",\n  "preference":"{{ dropdownName.property }}"\n}',
  autocompleteDataType: AutocompleteDataType.OBJECT,
};

function PostBodyData(props: Props) {
  const { actionName } = props;
  const theme = EditorTheme.LIGHT;

  return (
    <PostBodyContainer>
      <Section isFullWidth>
        <Zone layout="single_column">
          <div className="t--graphql-query-editor">
            <StyledFormLabel>Query</StyledFormLabel>
            <DynamicTextField
              border={CodeEditorBorder.ALL_SIDE}
              dataTreePath={`${actionName}.config.body`}
              evaluatedPopUpLabel={"Query"}
              mode={EditorModes.GRAPHQL_WITH_BINDING}
              name="actionConfiguration.body"
              placeholder={`{{\n\t{name: inputName.property, preference: dropdownName.property}\n}}`}
              showLineNumbers
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={theme}
            />
          </div>
        </Zone>
        <Zone layout="single_column">
          <div className="t--graphql-variable-editor">
            <StyledFormLabel>Query variables</StyledFormLabel>
            <DynamicTextField
              border={CodeEditorBorder.ALL_SIDE}
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
              theme={theme}
            />
          </div>
        </Zone>
      </Section>
    </PostBodyContainer>
  );
}

export default PostBodyData;
