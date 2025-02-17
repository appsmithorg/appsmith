import { useEffect, useState } from "react";
import {
  EditorEntityTab,
  EditorEntityTabState,
} from "IDE/Interfaces/EditorTypes";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { getCurrentEntityInfo } from "IDE/utils/getCurrentEntityInfo";

export const useCurrentEditorState = () => {
  const [selectedSegment, setSelectedSegment] = useState<EditorEntityTab>(
    EditorEntityTab.UI,
  );
  const [selectedSegmentState, setSelectedSegmentState] =
    useState<EditorEntityTabState>(EditorEntityTabState.Edit);

  const location = useLocation();

  /**
   * useEffect to identify the entity from the path
   *
   */
  useEffect(() => {
    const { entity } = identifyEntityFromPath(location.pathname);
    const { segment, segmentMode } = getCurrentEntityInfo(entity);

    setSelectedSegment(segment);
    setSelectedSegmentState(segmentMode);
  }, [location.pathname]);

  return {
    segment: selectedSegment,
    segmentMode: selectedSegmentState,
  };
};
