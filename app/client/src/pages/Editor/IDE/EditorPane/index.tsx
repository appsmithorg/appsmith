import React from "react";
import { ExplorerContainerBorder, Flex } from "@appsmith/ads";
import EditorPaneExplorer from "./Explorer";
import Editor from "./Editor";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import EntityProperties from "pages/Editor/Explorer/Entity/EntityProperties";

const EditorPane = () => {
  const ideViewMode = useSelector(getIDEViewMode);

  return (
    <Flex
      borderRight={
        ideViewMode === EditorViewMode.SplitScreen
          ? ExplorerContainerBorder.STANDARD
          : ExplorerContainerBorder.NONE
      }
      className="ide-editor-left-pane"
      flexDirection={
        ideViewMode === EditorViewMode.SplitScreen ? "column" : "row"
      }
      // @ts-expect-error Fix this the next time the file is edited
      gap="spacing-2"
      height="100%"
      width="100%"
    >
      {/** Entity Properties component is necessary to render
       the Bindings popover in the context menu.
       Will be removed eventually **/}
      <EntityProperties />
      <EditorPaneExplorer />
      <Editor />
    </Flex>
  );
};

export default EditorPane;
