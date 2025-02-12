import { useDispatch, useSelector } from "react-redux";
import { useJSAdd } from "../JSAdd";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./constants";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { useCallback } from "react";
import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import history, { NavigationMethod } from "utils/history";
import { closeJSActionTab } from "actions/jsActionActions";
import { closeQueryActionTab } from "actions/pluginActionActions";
import { isWidgetActionConnectionPresent } from "selectors/onboardingSelectors";
import localStorage, { LOCAL_STORAGE_KEYS } from "utils/localStorage";
import { useBoolean } from "usehooks-ts";

import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { useModuleOptions } from "ee/utils/moduleInstanceHelpers";
import { FocusEntity } from "navigation/FocusEntity";

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
    [segment, dispatch, basePageId, closeAddJS, closeAddQuery],
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

export const useIsJSAddLoading = () => {
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);

  if (jsModuleCreationOptions.length === 0) {
    return isCreating;
  }

  return false;
};
