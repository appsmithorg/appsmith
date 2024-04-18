import { Flex } from "design-system";
import React from "react";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import EditorTabs from "../EditorTabs/SplitScreenTabs";
import SegmentedHeader from "./components/SegmentedHeader";

export const SideBySideEditorPane = () => {
  const editorMode = useSelector(getIDEViewMode);
  return (
    <Flex
      flexDirection={
        editorMode === EditorViewMode.SplitScreen ? "column" : "row"
      }
    >
      <div>
        <SegmentedHeader />
        {editorMode === EditorViewMode.FullScreen && <div>list</div>}
      </div>
      <div>
        <EditorTabs />
        <div>Code</div>
      </div>
    </Flex>
  );
};
