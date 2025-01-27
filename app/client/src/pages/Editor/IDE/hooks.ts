import { useCallback, useEffect, useState } from "react";
import type { EntityItem } from "ee/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
} from "ee/entities/IDE/constants";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useDispatch, useSelector } from "react-redux";
import history, { NavigationMethod } from "utils/history";
import {
  builderURL,
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "ee/RouteBuilder";
import { getCurrentFocusInfo } from "selectors/focusHistorySelectors";
import { getIsAltFocusWidget, getWidgetSelectionBlock } from "selectors/ui";
import { altFocusWidget, setWidgetSelectionBlock } from "actions/widgetActions";
import { useJSAdd } from "ee/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./EditorTabs/constants";
import { createEditorFocusInfoKey } from "ee/navigation/FocusStrategy/AppIDEFocusStrategy";
import { FocusElement } from "navigation/FocusElements";
import { closeJSActionTab } from "actions/jsActionActions";
import { closeQueryActionTab } from "actions/pluginActionActions";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getCurrentEntityInfo } from "../utils";
import { useGitCurrentBranch } from "../gitSync/hooks/modHooks";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { useBoolean } from "usehooks-ts";
import { isWidgetActionConnectionPresent } from "selectors/onboardingSelectors";
import localStorage, { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";

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

export const useSegmentNavigation = (): {
  onSegmentChange: (value: string) => void;
} => {
  const ideType = getIDETypeByUrl(location.pathname);
  const { parentEntityId: baseParentEntityId } = useParentEntityInfo(ideType);

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
        history.push(queryListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.JS:
        history.push(jsCollectionListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
      case EditorEntityTab.UI:
        history.push(widgetListURL({ baseParentEntityId }), {
          invokedBy: NavigationMethod.SegmentControl,
        });
        break;
    }
  };

  return { onSegmentChange };
};

export const useGetPageFocusUrl = (basePageId: string): string => {
  const [focusPageUrl, setFocusPageUrl] = useState(builderURL({ basePageId }));

  const branch = useGitCurrentBranch();

  const editorStateFocusInfo = useSelector((appState) =>
    getCurrentFocusInfo(appState, createEditorFocusInfoKey(basePageId, branch)),
  );

  useEffect(() => {
    if (editorStateFocusInfo) {
      const lastSelectedEntity =
        editorStateFocusInfo.state[FocusElement.SelectedEntity];

      setFocusPageUrl(builderURL({ basePageId, suffix: lastSelectedEntity }));
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
      FocusEntity.WIDGET,
      FocusEntity.WIDGET_LIST,
    ].includes(currentFocus.entity);

    dispatch(setWidgetSelectionBlock(!inUIMode));
  }, [currentFocus, dispatch]);

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
  const basePageId = useSelector(getCurrentBasePageId);

  const addClickHandler = useCallback(() => {
    if (segment === EditorEntityTab.JS) openAddJS();

    if (segment === EditorEntityTab.QUERIES) openAddQuery();
  }, [segment, segmentMode, openAddQuery, openAddJS]);

  const tabClickHandler = useCallback(
    (item: EntityItem) => {
      const navigateToUrl = tabsConfig.itemUrlSelector(item, basePageId);

      if (navigateToUrl !== history.location.pathname) {
        history.push(navigateToUrl, {
          invokedBy: NavigationMethod.EditorTabs,
        });
      }
    },
    [tabsConfig, basePageId],
  );

  const closeClickHandler = useCallback(
    (actionId?: string) => {
      if (!actionId) {
        // handle JS
        return segment === EditorEntityTab.JS ? closeAddJS() : closeAddQuery();
      }

      if (segment === EditorEntityTab.JS)
        dispatch(closeJSActionTab({ id: actionId, parentId: basePageId }));

      if (segment === EditorEntityTab.QUERIES)
        dispatch(closeQueryActionTab({ id: actionId, parentId: basePageId }));
    },
    [segment, basePageId, dispatch],
  );

  return { addClickHandler, tabClickHandler, closeClickHandler };
};

export const useShowSideBySideNudge: () => [boolean, () => void] = () => {
  const widgetBindingsExist = useSelector(isWidgetActionConnectionPresent);

  const localStorageFlag = localStorage.getItem(
    LOCAL_STORAGE_KEYS.NUDGE_SHOWN_SPLIT_PANE,
  );

  const { setFalse, value } = useBoolean(
    widgetBindingsExist && !localStorageFlag,
  );

  const dismissNudge = useCallback(() => {
    setFalse();
    localStorage.setItem(LOCAL_STORAGE_KEYS.NUDGE_SHOWN_SPLIT_PANE, "true");
  }, [setFalse]);

  return [value, dismissNudge];
};
