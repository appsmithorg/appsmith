import { useEffect, useState } from "react";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import {
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { useIsBaseDesignWidth } from "utils/hooks/useDeviceDetect";
import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import { updateExplorerWidthAction } from "actions/explorerActions";
import { DEFAULT_EDITOR_PANE_WIDTH } from "constants/AppConstants";

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
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const isBaseDesignWidth = useIsBaseDesignWidth();

  // variables
  let propertyPaneWidth = useSelector(getPropertyPaneWidth);
  const defaultEditorPaneWidth: number = DEFAULT_EDITOR_PANE_WIDTH;

  const viewPortEighteenInPixel = window.innerWidth * 0.18;

  useEffect(() => {
    // property pane will be min value or 18% of view port width
    if (!isBaseDesignWidth) {
      propertyPaneWidth = viewPortEighteenInPixel;
      dispatch(setPropertyPaneWidthAction(viewPortEighteenInPixel));
    }

    // editorPane
    if (editorMode === EditorViewMode.FullScreen) {
      // In fullscreen, entity explorer will be always fixed width
      dispatch(updateExplorerWidthAction(defaultEditorPaneWidth));
    } else if (
      editorMode === EditorViewMode.SplitScreen &&
      segment !== EditorEntityTab.UI
    ) {
      // In split screen, while JS/Query tab is active
      const editorPaneWidthPixels = propertyPaneWidth + defaultEditorPaneWidth;
      dispatch(updateExplorerWidthAction(editorPaneWidthPixels));
    } else if (
      editorMode === EditorViewMode.SplitScreen &&
      segment === EditorEntityTab.UI
    ) {
      // In split screen, while UI tab is active
      dispatch(updateExplorerWidthAction(defaultEditorPaneWidth));
    }
  }, [isSideBySideEnabled, editorMode, segment, isBaseDesignWidth]);
};
