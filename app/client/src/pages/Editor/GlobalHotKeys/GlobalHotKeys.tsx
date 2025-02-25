import React, { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closePropertyPane,
  closeTableFilterPane,
  copyWidget,
  cutWidget,
  deleteSelectedWidget as _deleteSelectedWidget,
  groupWidgets,
  pasteWidget,
} from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { setGlobalSearchCategory as _setGlobalSearchCategory } from "actions/globalSearchActions";
import { getSelectedText, isMacOrIOS } from "utils/helpers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { WIDGETS_SEARCH_ID } from "constants/Explorer";
import { resetSnipingMode as resetSnipingModeAction } from "actions/propertyPaneActions";

import { runActionViaShortcut } from "actions/pluginActionActions";
import type { SearchCategory } from "components/editorComponents/GlobalSearch/utils";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import { redoAction, undoAction } from "actions/pageActions";

import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "ee/constants/messages";
import { matchBuilderPath } from "constants/routes";
import { toggleInstaller } from "actions/JSLibraryActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { toast } from "@appsmith/ads";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setPreviewModeInitAction as _setPreviewModeInitAction } from "actions/editorActions";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import {
  selectGitModEnabled,
  selectGitApplicationProtectedMode,
} from "selectors/gitModSelectors";
import { useHotkeys } from "@blueprintjs/core";
import { useHotKeys as useGitHotKeys } from "git";
import { getSelectedWidgets, getLastSelectedWidget } from "selectors/ui";
import { previewModeSelector } from "selectors/editorSelectors";

interface Props {
  children: React.ReactNode;
  getMousePosition: () => { x: number; y: number };
  toggleDebugger: () => void;
}

function GlobalHotKeys(props: Props) {
  const { children, getMousePosition, toggleDebugger } = props;

  const dispatch = useDispatch();
  const isGitModEnabled = useSelector(selectGitModEnabled);
  const isWalkthroughOpened = useContext(WalkthroughContext)?.isOpened;
  const gitHotKeys = useGitHotKeys();

  const selectedWidget = useSelector(getLastSelectedWidget);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useSelector(selectGitApplicationProtectedMode);

  const copySelectedWidget = useCallback(
    () => dispatch(copyWidget(true)),
    [dispatch],
  );
  const pasteCopiedWidget = useCallback(
    (mouseLocation: { x: number; y: number }) =>
      dispatch(pasteWidget({ groupWidgets: false, mouseLocation })),
    [dispatch],
  );
  const deleteSelectedWidget = useCallback(
    () => dispatch(_deleteSelectedWidget(true)),
    [dispatch],
  );
  const cutSelectedWidget = useCallback(
    () => dispatch(cutWidget()),
    [dispatch],
  );
  const groupSelectedWidget = useCallback(
    () => dispatch(groupWidgets()),
    [dispatch],
  );
  const setGlobalSearchCategory = useCallback(
    (category: SearchCategory) => dispatch(_setGlobalSearchCategory(category)),
    [dispatch],
  );
  const resetSnipingMode = useCallback(
    () => dispatch(resetSnipingModeAction()),
    [dispatch],
  );
  const closeProppane = useCallback(
    () => dispatch(closePropertyPane()),
    [dispatch],
  );
  const closeTableFilterProppane = useCallback(
    () => dispatch(closeTableFilterPane()),
    [dispatch],
  );
  const selectAllWidgetsInit = useCallback(
    () => dispatch(selectWidgetInitAction(SelectionRequestType.All)),
    [dispatch],
  );
  const deselectAllWidgets = useCallback(
    () => dispatch(selectWidgetInitAction(SelectionRequestType.Empty)),
    [dispatch],
  );
  const executeAction = useCallback(
    () => dispatch(runActionViaShortcut()),
    [dispatch],
  );
  const undo = useCallback(() => dispatch(undoAction()), [dispatch]);
  const redo = useCallback(() => dispatch(redoAction()), [dispatch]);
  const hideInstaller = useCallback(
    () => dispatch(toggleInstaller(false)),
    [dispatch],
  );
  const setPreviewModeInitAction = useCallback(
    (shouldSet: boolean) => dispatch(_setPreviewModeInitAction(shouldSet)),
    [dispatch],
  );

  const showCommitModal = useCallback(() => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.DEPLOY,
      }),
    );
  }, [dispatch]);

  const stopPropagationIfWidgetSelected = useCallback(
    (e: KeyboardEvent): boolean => {
      const multipleWidgetsSelected = selectedWidgets && selectedWidgets.length;
      const singleWidgetSelected =
        selectedWidget && selectedWidget != MAIN_CONTAINER_WIDGET_ID;

      if (
        (singleWidgetSelected || multipleWidgetsSelected) &&
        !getSelectedText()
      ) {
        e.preventDefault();
        e.stopPropagation();

        return true;
      }

      return false;
    },
    [selectedWidgets, selectedWidget],
  );

  const onOnmnibarHotKeyDown = useCallback(
    (
      e: KeyboardEvent,
      categoryId: SEARCH_CATEGORY_ID = SEARCH_CATEGORY_ID.NAVIGATION,
    ) => {
      e.preventDefault();

      if (isPreviewMode) return;

      const category = filterCategories[categoryId];

      setGlobalSearchCategory(category);
      hideInstaller();
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "HOTKEY_COMBO",
        category: category.title,
      });
    },
    [isPreviewMode, setGlobalSearchCategory, hideInstaller, AnalyticsUtil],
  );

  const hotkeys = useMemo(() => {
    if (isWalkthroughOpened || isProtectedMode) {
      return [];
    } else {
      return [
        {
          combo: "mod + f",
          global: true,
          label: "Search entities",
          onKeyDown: (e: KeyboardEvent) => {
            const widgetSearchInput =
              document.getElementById(WIDGETS_SEARCH_ID);

            if (widgetSearchInput) {
              widgetSearchInput.focus();
              e.preventDefault();
              e.stopPropagation();
            }
          },
        },
        {
          combo: "mod + p",
          global: true,
          label: "Navigate",
          onKeyDown: (e: KeyboardEvent) => onOnmnibarHotKeyDown(e),
        },
        {
          combo: "mod + plus",
          global: true,
          label: "Create new",
          onKeyDown: (e: KeyboardEvent) =>
            onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.ACTION_OPERATION),
        },
        {
          combo: "mod + k",
          global: true,
          label: "Show omnibar",
          onKeyDown: (e: KeyboardEvent) =>
            onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.INIT),
        },
        {
          combo: "mod + d",
          global: true,
          group: "Canvas",
          label: "Open Debugger",
          onKeyDown: toggleDebugger,
          preventDefault: true,
        },
        {
          combo: "mod + c",
          global: true,
          group: "Canvas",
          label: "Copy widget",
          onKeyDown: (e: KeyboardEvent) => {
            if (stopPropagationIfWidgetSelected(e)) {
              copySelectedWidget();
            }
          },
        },
        {
          combo: "mod + v",
          global: true,
          group: "Canvas",
          label: "Paste Widget",
          onKeyDown: () => {
            if (matchBuilderPath(window.location.pathname)) {
              pasteCopiedWidget(getMousePosition() || { x: 0, y: 0 });
            }
          },
        },
        {
          combo: "backspace",
          global: true,
          group: "Canvas",
          label: "Delete widget",
          onKeyDown: (e: KeyboardEvent) => {
            if (stopPropagationIfWidgetSelected(e) && isMacOrIOS()) {
              deleteSelectedWidget();
            }
          },
        },
        {
          combo: "del",
          global: true,
          group: "Canvas",
          label: "Delete widget",
          onKeyDown: (e: KeyboardEvent) => {
            if (stopPropagationIfWidgetSelected(e)) {
              deleteSelectedWidget();
            }
          },
        },
        {
          combo: "mod + x",
          global: true,
          group: "Canvas",
          label: "Cut Widget",
          onKeyDown: (e: KeyboardEvent) => {
            if (stopPropagationIfWidgetSelected(e)) {
              cutSelectedWidget();
            }
          },
        },
        {
          combo: "mod + a",
          global: true,
          group: "Canvas",
          label: "Select all Widget",
          onKeyDown: (e: KeyboardEvent) => {
            if (matchBuilderPath(window.location.pathname)) {
              selectAllWidgetsInit();
              e.preventDefault();
            }
          },
        },
        {
          combo: "esc",
          global: true,
          group: "Canvas",
          label: "Deselect all Widget",
          onKeyDown: (e: KeyboardEvent) => {
            resetSnipingMode();

            if (matchBuilderPath(window.location.pathname)) {
              deselectAllWidgets();
              closeProppane();
              closeTableFilterProppane();
            }

            e.preventDefault();
          },
        },
        {
          combo: "v",
          global: true,
          label: "Edit Mode",
          onKeyDown: (e: KeyboardEvent) => {
            resetSnipingMode();
            e.preventDefault();
          },
        },
        {
          combo: "mod + enter",
          global: true,
          label: "Execute Action",
          onKeyDown: executeAction,
          preventDefault: true,
          stopPropagation: true,
        },
        {
          combo: "mod + z",
          global: true,
          label: "Undo change in canvas",
          onKeyDown: undo,
          preventDefault: true,
          stopPropagation: true,
        },
        {
          combo: "mod + shift + z",
          global: true,
          label: "Redo change in canvas",
          onKeyDown: redo,
          preventDefault: true,
          stopPropagation: true,
        },
        {
          combo: "mod + y",
          global: true,
          label: "Redo change in canvas",
          onKeyDown: redo,
          preventDefault: true,
          stopPropagation: true,
        },
        {
          combo: "mod + g",
          global: true,
          group: "Canvas",
          label: "Cut Widgets for grouping",
          onKeyDown: (e: KeyboardEvent) => {
            if (stopPropagationIfWidgetSelected(e)) {
              groupSelectedWidget();
            }
          },
        },
        {
          combo: "mod + s",
          global: true,
          label: "Save progress",
          onKeyDown: () => {
            toast.show(createMessage(SAVE_HOTKEY_TOASTER_MESSAGE), {
              kind: "info",
            });
          },
          preventDefault: true,
          stopPropagation: true,
        },
        {
          combo: "alt + p",
          global: true,
          label: "Preview Mode",
          onKeyDown: () => {
            setPreviewModeInitAction(!isPreviewMode);
          },
        },
        ...(isGitModEnabled
          ? gitHotKeys
          : [
              {
                combo: "ctrl + shift + g",
                global: true,
                label: "Show git commit modal",
                onKeyDown: showCommitModal,
              },
            ]),
      ];
    }
  }, [
    isWalkthroughOpened,
    isProtectedMode,
    isGitModEnabled,
    gitHotKeys,
    showCommitModal,
    isPreviewMode,
    getMousePosition,
    toggleDebugger,
    copySelectedWidget,
    pasteCopiedWidget,
    deleteSelectedWidget,
    cutSelectedWidget,
    selectAllWidgetsInit,
    deselectAllWidgets,
    closeProppane,
    closeTableFilterProppane,
    resetSnipingMode,
    executeAction,
    undo,
    redo,
    groupSelectedWidget,
    setPreviewModeInitAction,
    onOnmnibarHotKeyDown,
    stopPropagationIfWidgetSelected,
  ]);

  useHotkeys(hotkeys, { showDialogKeyCombo: "?" });

  return <div>{children}</div>;
}

export default GlobalHotKeys;
