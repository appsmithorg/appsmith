import React from "react";
import { Field } from "redux-form";
// // Codemirror GraphQL plugins
import "codemirror-graphql/hint";
import "codemirror-graphql/info";
import "codemirror-graphql/jump";
import "codemirror-graphql/mode";

import QueryWrapper from "../GraphQL/QueryWrapperWithCSS";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Text, TextType } from "design-system-old";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";

const QueryHeader = styled.div`
  display: flex;
  width: 100%;
  background: var(--ads-v2-color-bg-subtle);
  padding: 8px 16px;
`;

type QueryProps = {
  // Path to store the value in the actual data object
  dataTreePath: string;
  // Height for the editor
  height: string;
  // Name of the field of the form
  name: string;
  // Theme to be used in CodeEditor
  theme: EditorTheme;
};

export const Container = styled.div`
  margin-left: 16px;
  padding-bottom: 8px;
  z-index: -1;
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.05);
`;

export const CollapseContainer = styled.div`
  margin-left: 16px;
`;

/**
 * Query Editor is for writing Graphql query using the Codemirror Editor which we use
 * @param props Props that are required by the CodeEditor to render the query editor
 * @returns Component with Editor
 */
function ResponseViewer(props: QueryProps) {
  const editorProps = {
    mode: EditorModes.JSON,
    tabBehaviour: TabBehaviour.INDENT,
    size: EditorSize.EXTENDED,
    showLineNumbers: true,
    isReadOnly: true,
  };

  return (
    <QueryWrapper className="t--graphql-query-editor">
      <QueryHeader>
        <Text color={"var(--ads-v2-color-fg)"} type={TextType.H6}>
          Response
        </Text>
      </QueryHeader>
      <Field
        border={CodeEditorBorder.NONE}
        borderLess
        component={LazyCodeEditor}
        evaluatedPopUpLabel="Query"
        {...props}
        {...editorProps}
      />
    </QueryWrapper>
  );
}

export default ResponseViewer;
