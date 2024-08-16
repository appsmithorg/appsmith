import React from "react";
import { Flex, Spinner, Button } from "@appsmith/ads";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { useIsJSAddLoading } from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import { EditorEntityTabState } from "ee/entities/IDE/constants";

const AddButton = () => {
  const { addClickHandler } = useIDETabClickHandlers();
  const isJSLoading = useIsJSAddLoading();
  const { segmentMode } = useCurrentEditorState();

  if (segmentMode === EditorEntityTabState.Add) {
    return null;
  }
  if (isJSLoading) {
    return (
      <Flex px="spaces-2">
        <Spinner size="md" />
      </Flex>
    );
  }
  return (
    <Button
      className="!min-w-[24px]"
      data-testid="t--ide-tabs-add-button"
      id="tabs-add-toggle"
      isIconButton
      kind="tertiary"
      onClick={addClickHandler}
      size="sm"
      startIcon="add-line"
    />
  );
};

export { AddButton };
