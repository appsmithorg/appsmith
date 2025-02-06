import React from "react";
import { useEventCallback } from "usehooks-ts";

import { DismissibleTab, Text } from "@appsmith/ads";

import {
  EditorEntityTab,
  EditorEntityTabState,
} from "IDE/Interfaces/EditorTypes";

import { useCurrentEditorState } from "../hooks";

const AddTab = ({
  isListActive,
  newTabClickCallback,
  onClose,
}: {
  newTabClickCallback: () => void;
  onClose: (actionId?: string) => void;
  isListActive: boolean;
}) => {
  const { segment, segmentMode } = useCurrentEditorState();

  const onCloseClick = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  });

  if (segmentMode !== EditorEntityTabState.Add) return null;

  const segmentName = segment === EditorEntityTab.JS ? "JS" : "Query";
  const content = `New ${segmentName}`;
  const dataTestId = `t--ide-tab-new_${segmentName.toLowerCase()}`;

  return (
    <DismissibleTab
      dataTestId={dataTestId}
      isActive={segmentMode === EditorEntityTabState.Add && !isListActive}
      onClick={newTabClickCallback}
      onClose={onCloseClick}
    >
      <Text kind="body-s">{content}</Text>
    </DismissibleTab>
  );
};

export { AddTab };
