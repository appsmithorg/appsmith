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
  builderURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { DEFAULT_EDITOR_PANE_WIDTH } from "constants/AppConstants";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
import { getFocusInfo } from "selectors/focusHistorySelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

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
      case FocusEntity.QUERY_MODULE_INSTANCE:
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
      case FocusEntity.JS_MODULE_INSTANCE:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.Edit);
        break;
      case FocusEntity.JS_OBJECT_ADD:
        setSelectedSegment(EditorEntityTab.JS);
        setSelectedSegmentState(EditorEntityTabState.Add);
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

export const useEditorPaneWidth = (): string => {
  const [width, setWidth] = useState(DEFAULT_EDITOR_PANE_WIDTH + "px");
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
      // 1px is propertypane border width
      setWidth("40.4vw");
    } else {
      setWidth(DEFAULT_EDITOR_PANE_WIDTH + "px");
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

export const useGetPageFocusUrl = (pageId: string): string => {
  const editorStateString = "EDITOR_STATE.";
  const focusInfo = useSelector(getFocusInfo);
  const branch = useSelector(getCurrentGitBranch);
  const [focusPageUrl, setFocusPageUrl] = useState(
    builderURL({ pageId: pageId }),
  );

  useEffect(() => {
    const editorState = pickBy(
      focusInfo,
      (v, k) =>
        k === editorStateString + pageId + "#" + (branch || "undefined"),
    );

    if (isEmpty(editorState)) {
      return;
    }

    const segment =
      Object.values(editorState)[0].state?.SelectedSegment ||
      EditorEntityTab.UI;

    switch (segment) {
      case EditorEntityTab.UI:
        setFocusPageUrl(widgetListURL({ pageId: pageId }));
        break;
      case EditorEntityTab.JS:
        setFocusPageUrl(jsCollectionListURL({ pageId: pageId }));
        break;
      case EditorEntityTab.QUERIES:
        setFocusPageUrl(queryListURL({ pageId: pageId }));
        break;
    }
  }, [focusInfo, branch]);

  return focusPageUrl;
};
