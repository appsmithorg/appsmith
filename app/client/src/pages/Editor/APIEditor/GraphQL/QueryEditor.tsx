import React from "react";
import { Field } from "redux-form";
// // Codemirror GraphQL plugins
import "codemirror-graphql/hint";
import "codemirror-graphql/info";
import "codemirror-graphql/jump";
import "codemirror-graphql/mode";

import QueryWrapper from "./QueryWrapperWithCSS";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esnext/common";
import { Text, TextType } from "components/ads";

const QueryHeader = styled.div`
  display: flex;
  width: 100%;
  background: ${Colors.GREY_2};
  padding: 8px 16px;
`;

/**
 * Query Editor is for writing Graphql query using the Codemirror Editor which we use
 * @param props Props that are required by the CodeEditor to render the query editor
 * @returns Component with Editor
 */
function QueryEditor(props: any) {
  const editorProps = {
    mode: EditorModes.GRAPHQL,
    tabBehaviour: TabBehaviour.INDENT,
    size: EditorSize.EXTENDED,
  };

  return (
    <QueryWrapper>
      <QueryHeader>
        <TooltipComponent
          content="Add your query here!"
          hoverOpenDelay={300}
          position={Position.BOTTOM_LEFT}
        >
          <Text color={Colors.GRAY_700} type={TextType.H6}>
            Query
          </Text>
        </TooltipComponent>
      </QueryHeader>
      <Field component={CodeEditor} {...props} {...editorProps} />
    </QueryWrapper>
  );
}

export default QueryEditor;
