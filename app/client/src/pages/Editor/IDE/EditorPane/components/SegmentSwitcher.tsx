import React from "react";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import { EditorSegments } from "@appsmith/ads";

const SegmentSwitcher = () => {
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();

  return (
    <EditorSegments
      onSegmentChange={onSegmentChange}
      options={[
        {
          label: createMessage(EDITOR_PANE_TEXTS.queries_tab),
          value: EditorEntityTab.QUERIES,
        },
        {
          label: createMessage(EDITOR_PANE_TEXTS.js_tab),
          value: EditorEntityTab.JS,
        },
        {
          label: createMessage(EDITOR_PANE_TEXTS.ui_tab),
          value: EditorEntityTab.UI,
        },
      ]}
      selectedSegment={segment}
    />
  );
};

export default SegmentSwitcher;
