import React, { useMemo } from "react";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import { useSegmentNavigation } from "./useSegmentNavigation";
import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { EditorSegments } from "@appsmith/ads";

const SegmentSwitcher = () => {
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();

  const segmentOptions = useMemo(() => {
    return [
      {
        label: createMessage(EDITOR_PANE_TEXTS.queries_tab),
        startIcon: "queries-line",
        value: EditorEntityTab.QUERIES,
      },
      {
        label: createMessage(EDITOR_PANE_TEXTS.js_tab),
        startIcon: "content-type-json",
        value: EditorEntityTab.JS,
      },
      {
        label: createMessage(EDITOR_PANE_TEXTS.ui_tab),
        startIcon: "dashboard-line",
        value: EditorEntityTab.UI,
      },
    ];
  }, []);

  return (
    <EditorSegments
      onSegmentChange={onSegmentChange}
      options={segmentOptions}
      selectedSegment={segment}
    />
  );
};

export default SegmentSwitcher;
