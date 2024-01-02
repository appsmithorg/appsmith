import React from "react";
import { Button, Flex } from "design-system";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab, EditorViewMode } from "entities/IDE/constants";
import { useDispatch } from "react-redux";
import { setIdeEditorViewMode } from "actions/ideActions";
import { TabComponent } from "./TabComponent";

const FileTabs = () => {
  const dispatch = useDispatch();
  const { segment } = useCurrentEditorState();
  if (segment === EditorEntityTab.UI) {
    return null;
  }
  return (
    <Flex
      backgroundColor="#F8FAFC"
      borderBottom="#F1F5F9"
      gap="spaces-2"
      padding="spaces-2"
      width="100%"
    >
      <TabComponent segment={segment} />
      <Button
        isIconButton
        kind="tertiary"
        onClick={() =>
          dispatch(setIdeEditorViewMode(EditorViewMode.HalfScreen))
        }
        startIcon="icon-align-left"
      />
    </Flex>
  );
};

export default FileTabs;
