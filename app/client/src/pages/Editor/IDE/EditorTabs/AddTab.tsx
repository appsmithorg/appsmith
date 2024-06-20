import React from "react";

import { FileTab } from "IDE/Components/FileTab";
import { useCurrentEditorState } from "../hooks";
import {
  EditorEntityTab,
  EditorEntityTabState,
} from "@appsmith/entities/IDE/constants";

const AddTab = ({
  newTabClickCallback,
  onClose,
}: {
  newTabClickCallback: () => void;
  onClose: (actionId?: string) => void;
}) => {
  const { segment, segmentMode } = useCurrentEditorState();

  if (segmentMode !== EditorEntityTabState.Add) return null;

  const onCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <FileTab
      isActive={segmentMode === EditorEntityTabState.Add}
      onClick={newTabClickCallback}
      onClose={(e) => onCloseClick(e)}
      title={`New ${segment === EditorEntityTab.JS ? "JS" : "Query"}`}
    />
  );
};

export { AddTab };
