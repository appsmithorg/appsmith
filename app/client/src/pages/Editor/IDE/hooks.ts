import { useEffect, useState } from "react";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorState,
} from "entities/IDE/constants";
import { useLocation } from "react-router";
import { getCurrentAppState } from "entities/IDE/utils";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";

export const useCurrentAppState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  useEffect(() => {
    setAppState(getCurrentAppState(pathname));
  }, [pathname]);

  return appState;
};

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
    const currentEntityInfo = identifyEntityFromPath(location.pathname);
    switch (currentEntityInfo.entity) {
      case FocusEntity.QUERY:
      case FocusEntity.API:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.QUERY_LIST:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      case FocusEntity.QUERY_ADD:
        setSelectedSegment(EditorEntityTab.QUERIES);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
      case FocusEntity.JS_OBJECT:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.JS_OBJECT_LIST:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      case FocusEntity.CANVAS:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
      case FocusEntity.PROPERTY_PANE:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.WIDGET_LIST:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.List);
        break;
      default:
        setSelectedSegment(EditorEntityTab.UI);
        setSelectedSegmentState(EditorEntityTabState.Add);
        break;
    }
  }, [location.pathname]);

  return {
    segment: selectedSegment,
    segmentMode: selectedSegmentState,
  };
};
