import React from "react";
import { Flex } from "design-system";
import { useEditorPaneWidth } from "../hooks";
import EditorPaneExplorer from "./Explorer";
import Editor from "./Editor";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

const EditorPane = () => {
  const width = useEditorPaneWidth();
  const ideViewMode = useSelector(getIDEViewMode);

  return (
    <Flex
      className="ide-editor-left-pane"
      flexDirection={
        ideViewMode === EditorViewMode.SplitScreen ? "column" : "row"
      }
      // @ts-expect-error Fix this the next time the file is edited
      gap="spacing-2"
      height="100%"
      overflow="hidden"
      width={width}
    >
      <EditorPaneExplorer />
      <Editor />
    </Flex>
  );
};

export default EditorPane;
