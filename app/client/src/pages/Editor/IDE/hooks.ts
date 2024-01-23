import { useEffect, useState } from "react";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import {
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import {
  DEFAULT_APP_SIDEBAR_WIDTH,
  DEFAULT_EDITOR_PANE_WIDTH,
  DEFAULT_PROPERTY_PANE_WIDTH,
  DESIGN_BASE_WIDTH,
} from "constants/AppConstants";
import { useIsBaseDesignWidth } from "utils/hooks/useDeviceDetect";

export const useCurrentAppState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  const entityInfo = identifyEntityFromPath(pathname);
  useEffect(() => {
    setAppState(entityInfo.appState);
  }, [entityInfo.appState]);

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

export const useEditorPaneWidth = (): number => {
  const [width, setWidth] = useState(255);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);
  useEffect(() => {
    if (
      isSideBySideEnabled &&
      editorMode === EditorViewMode.SplitScreen &&
      segment !== EditorEntityTab.UI
    ) {
      setWidth(255 + propertyPaneWidth);
    } else {
      setWidth(255);
    }
  }, [isSideBySideEnabled, editorMode, segment, propertyPaneWidth]);

  return width;
};

export const useSegmentNavigation = (): {
  onSegmentChange: (value: string) => void;
} => {
  const pageId = useSelector(getCurrentPageId);

  /**
   * Callback to handle the segment change
   *
   * @param value
   * @returns
   *
   */
  const onSegmentChange = (value: string) => {
    switch (value) {
      case EditorEntityTab.QUERIES:
        history.push(queryListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.JS:
        history.push(jsCollectionListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.UI:
        history.push(widgetListURL({ pageId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
    }
  };

  return { onSegmentChange };
};

export const useIDEWidths = () => {
  // selectors
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const isBaseDesignWidth = useIsBaseDesignWidth();

  // variables
  const defaultPropertyPaneWidth: string = DEFAULT_PROPERTY_PANE_WIDTH + "px";
  const defaultEditorPaneWidth: string = DEFAULT_EDITOR_PANE_WIDTH + "px";
  const [propertyPaneWidth, setPropertyPaneWidth] = useState<string>(
    defaultPropertyPaneWidth,
  );
  const [editorPaneWidth, setEditorPaneWidth] = useState<string>(
    defaultEditorPaneWidth,
  );

  useEffect(() => {
    // property pane will be min value or 18% of view port width
    setPropertyPaneWidth(isBaseDesignWidth ? defaultPropertyPaneWidth : "18vw");

    // editorPane
    if (editorMode === EditorViewMode.FullScreen) {
      // In fullscreen, entity explorer will be always fixed width
      setEditorPaneWidth(defaultEditorPaneWidth);
    } else if (
      editorMode === EditorViewMode.SplitScreen &&
      segment !== EditorEntityTab.UI
    ) {
      // In split screen, while JS/Query tab is active

      // 562 is the width required to accomodate 70/65 characters
      // considering 12px font size
      // 562 * 100 = 56200
      const _editorPaneWidth =
        (56200 / (DESIGN_BASE_WIDTH - DEFAULT_APP_SIDEBAR_WIDTH)).toFixed(2) +
        "vw";
      setEditorPaneWidth(_editorPaneWidth);
    } else if (
      editorMode === EditorViewMode.SplitScreen &&
      segment === EditorEntityTab.UI
    ) {
      // In split screen, while UI tab is active
      setEditorPaneWidth(defaultEditorPaneWidth);
    }
  }, [isSideBySideEnabled, editorMode, segment, isBaseDesignWidth]);

  return { propertyPaneWidth, editorPaneWidth };
};
