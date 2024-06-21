import { useCallback, useEffect, useState } from "react";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
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
  builderURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import {
  DEFAULT_EDITOR_PANE_WIDTH,
  DEFAULT_SPLIT_SCREEN_WIDTH,
} from "constants/AppConstants";
import { getIsAltFocusWidget, getWidgetSelectionBlock } from "selectors/ui";
import { altFocusWidget, setWidgetSelectionBlock } from "actions/widgetActions";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./EditorTabs/constants";
import { createEditorFocusInfoKey } from "@appsmith/navigation/FocusStrategy/AppIDEFocusStrategy";
import { FocusElement } from "navigation/FocusElements";
import { closeJSActionTab } from "actions/jsActionActions";
import { closeQueryActionTab } from "actions/pluginActionActions";
import { getCurrentEntityInfo } from "../utils";

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
      setWidth(DEFAULT_SPLIT_SCREEN_WIDTH);
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
  const [focusPageUrl, setFocusPageUrl] = useState(
    builderURL({ pageId: pageId }),
  );

  const branch = useSelector(getCurrentGitBranch);
  const editorStateFocusInfo = useSelector((appState) =>
    getCurrentFocusInfo(appState, createEditorFocusInfoKey(pageId, branch)),
  );

  useEffect(() => {
    if (editorStateFocusInfo) {
      const lastSelectedEntity =
        editorStateFocusInfo.state[FocusElement.SelectedEntity];

      setFocusPageUrl(builderURL({ pageId, suffix: lastSelectedEntity }));
    }
  }, [editorStateFocusInfo, branch]);

  return focusPageUrl;
};

export function useWidgetSelectionBlockListener() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const currentFocus = identifyEntityFromPath(pathname);
  const isAltFocused = useSelector(getIsAltFocusWidget);
  const widgetSelectionIsBlocked = useSelector(getWidgetSelectionBlock);

  useEffect(() => {
    const inUIMode = [
      FocusEntity.CANVAS,
      FocusEntity.PROPERTY_PANE,
      FocusEntity.WIDGET_LIST,
    ].includes(currentFocus.entity);
    dispatch(setWidgetSelectionBlock(!inUIMode));
  }, [currentFocus]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isAltFocused, widgetSelectionIsBlocked]);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isAltFocused && widgetSelectionIsBlocked && e.metaKey) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!e.metaKey && widgetSelectionIsBlocked) {
      dispatch(altFocusWidget(e.metaKey));
    }
  };
}

export const useIDETabClickHandlers = () => {
  const dispatch = useDispatch();
  const { closeAddJS, openAddJS } = useJSAdd();
  const { closeAddQuery, openAddQuery } = useQueryAdd();
  const { segment, segmentMode } = useCurrentEditorState();
  const tabsConfig = TabSelectors[segment];
  const pageId = useSelector(getCurrentPageId);

  const addClickHandler = useCallback(() => {
    if (segment === EditorEntityTab.JS) openAddJS();
    if (segment === EditorEntityTab.QUERIES) openAddQuery();
  }, [segment, segmentMode, openAddQuery, openAddJS]);

  const tabClickHandler = useCallback(
    (item: EntityItem) => {
      const navigateToUrl = tabsConfig.itemUrlSelector(item, pageId);
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EditorTabs,
      });
    },
    [segment, pageId],
  );

  const closeClickHandler = useCallback(
    (actionId?: string) => {
      if (!actionId) {
        // handle JS
        return segment === EditorEntityTab.JS ? closeAddJS() : closeAddQuery();
      }
      if (segment === EditorEntityTab.JS)
        dispatch(closeJSActionTab({ id: actionId, parentId: pageId }));
      if (segment === EditorEntityTab.QUERIES)
        dispatch(closeQueryActionTab({ id: actionId, parentId: pageId }));
    },
    [segment, pageId, dispatch],
  );

  return { addClickHandler, tabClickHandler, closeClickHandler };
};
