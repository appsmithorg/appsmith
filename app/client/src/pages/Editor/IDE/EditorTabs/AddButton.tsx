import type { Ref } from "react";
import React, { forwardRef } from "react";
import { Flex, Spinner, Button } from "design-system";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { useIsJSAddLoading } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import {
  EditorEntityTab,
  EditorEntityTabState,
} from "@appsmith/entities/IDE/constants";
import { FileTab } from "IDE/Components/FileTab";

const AddButton = forwardRef(
  (
    {
      newTabClickCallback,
      onClose,
    }: {
      newTabClickCallback: () => void;
      onClose: (actionId?: string) => void;
    },
    ref: Ref<HTMLDivElement>,
  ) => {
    const { addClickHandler } = useIDETabClickHandlers();
    const isJSLoading = useIsJSAddLoading();
    const { segment, segmentMode } = useCurrentEditorState();

    if (isJSLoading) {
      return (
        <Flex px="spaces-2">
          <Spinner size="md" />
        </Flex>
      );
    }

    const onCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    return segmentMode === EditorEntityTabState.Add ? (
      <FileTab
        isActive={segmentMode === EditorEntityTabState.Add}
        onClick={newTabClickCallback}
        onClose={(e) => onCloseClick(e)}
        title={`New ${segment === EditorEntityTab.JS ? "JS" : "Query"}`}
      />
    ) : (
      <div
        className="bg-white sticky right-0 flex items-center h-[32px] border-b border-b-[var(--ads-v2-color-border-muted)] pl-[var(--ads-v2-spaces-2)]"
        ref={ref}
      >
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
      </div>
    );
  },
);

export { AddButton };
