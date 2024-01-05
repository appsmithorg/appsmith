import React from "react";
import FileTabs from "./FileTabs";
import { useDispatch, useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "entities/IDE/constants";
import { Button, Flex } from "design-system";
import { setIdeEditorViewMode } from "actions/ideActions";

const EditorTabs = () => {
  const ideViewMode = useSelector(getIDEViewMode);
  const dispatch = useDispatch();
  return (
    <Flex
      backgroundColor="#F8FAFC"
      borderBottom="#F1F5F9"
      gap="spaces-2"
      padding="spaces-2"
      width="100%"
    >
      {ideViewMode === EditorViewMode.HalfScreen ? (
        <Button isIconButton kind={"secondary"} startIcon={"add-line"} />
      ) : null}
      <FileTabs />
      {ideViewMode === EditorViewMode.HalfScreen ? (
        <Button isIconButton kind="secondary" startIcon={"chevron-down"} />
      ) : (
        <Button
          isIconButton
          kind="tertiary"
          onClick={() =>
            dispatch(setIdeEditorViewMode(EditorViewMode.HalfScreen))
          }
          startIcon="icon-align-left"
        />
      )}
    </Flex>
  );
};

export default EditorTabs;
