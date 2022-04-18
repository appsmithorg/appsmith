import React from "react";
import { Field } from "redux-form";
// // Codemirror GraphQL plugins
import "codemirror-graphql/hint";
import "codemirror-graphql/info";
import "codemirror-graphql/jump";
import "codemirror-graphql/mode";

import "./css.css";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  // CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esnext/common";
import { Text, TextType } from "components/ads";

const QueryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const QueryHeader = styled.div`
  display: flex;
  width: 100%;
  background: ${Colors.GREY_2};
  padding: 8px 16px;
`;

function QueryEditor(props: any) {
  const editorProps = {
    mode: EditorModes.GRAPHQL,
    tabBehaviour: TabBehaviour.INPUT,
    size: EditorSize.COMPACT,
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
