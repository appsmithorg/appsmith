import React, { useCallback, useRef } from "react";
import styled from "styled-components";
import QueryEditor from "pages/Editor/APIEditor/GraphQL/QueryEditor";
import VariableEditor from "pages/Editor/APIEditor/GraphQL/VariableEditor";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import classNames from "classnames";
import { tailwindLayers } from "constants/Layers";

const ResizableDiv = styled.div`
  display: flex;
  height: 100%;
  flex-shrink: 0;
`;

const PostBodyContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
  &&&& .CodeMirror {
    height: 100%;
    border-top: 1px solid var(--ads-v2-color-border);
    border-bottom: 1px solid var(--ads-v2-color-border);
    border-radius: 0;
    padding: 0;
  }
  & .CodeMirror-scroll {
    margin: 0px;
    padding: 0px;
    overflow: auto !important;
  }
`;

const ResizerHandler = styled.div<{ resizing: boolean }>`
  width: 6px;
  height: 100%;
  margin-left: 2px;
  border-right: 1px solid var(--ads-v2-color-border);
  background: ${(props) =>
    props.resizing ? "var(--ads-v2-color-border)" : "transparent"};
  &:hover {
    background: var(--ads-v2-color-border);
    border-color: transparent;
  }
`;

const DEFAULT_GRAPHQL_VARIABLE_WIDTH = 300;

interface Props {
  actionName: string;
}

function PostBodyData(props: Props) {
  const { actionName } = props;
  const theme = EditorTheme.LIGHT;
  const resizeableRef = useRef<HTMLDivElement>(null);
  const [variableEditorWidth, setVariableEditorWidth] = React.useState(
    DEFAULT_GRAPHQL_VARIABLE_WIDTH,
  );
  /**
   * Variable Editor's resizeable handler for the changing of width
   */
  const onVariableEditorWidthChange = useCallback((newWidth) => {
    setVariableEditorWidth(newWidth);
  }, []);

  const { onMouseDown, onMouseUp, onTouchStart, resizing } =
    useHorizontalResize(
      resizeableRef,
      onVariableEditorWidthChange,
      undefined,
      true,
    );

  return (
    <PostBodyContainer>
      <QueryEditor
        dataTreePath={`${actionName}.config.body`}
        height="100%"
        name="actionConfiguration.body"
        theme={theme}
      />
      <div
        className={`w-2 h-full -ml-2 group  cursor-ew-resize ${tailwindLayers.resizer}`}
        onMouseDown={onMouseDown}
        onTouchEnd={onMouseUp}
        onTouchStart={onTouchStart}
      >
        <ResizerHandler
          className={classNames({
            "transform transition": true,
          })}
          resizing={resizing}
        />
      </div>
      <ResizableDiv
        ref={resizeableRef}
        style={{
          width: `${variableEditorWidth}px`,
          paddingRight: "2px",
        }}
      >
        <VariableEditor actionName={actionName} theme={theme} />
      </ResizableDiv>
    </PostBodyContainer>
  );
}

export default PostBodyData;
