import React from "react";
import { useEventCallback } from "usehooks-ts";

import { DismissibleTab, Text } from "@appsmith/ads";

import {
  EditorEntityTab,
  EditorEntityTabState,
} from "ee/entities/IDE/constants";

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

  const content = `New ${segment === EditorEntityTab.JS ? "JS" : "Query"}`;

  return (
    <DismissibleTab
      isActive={segmentMode === EditorEntityTabState.Add && !isListActive}
      onClick={newTabClickCallback}
      onClose={onCloseClick}
    >
      <Text kind="body-s">{content}</Text>
    </DismissibleTab>
  );
};

export { AddTab };
