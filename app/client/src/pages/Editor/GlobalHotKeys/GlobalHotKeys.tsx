import React, { useCallback, useContext, useMemo } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { Hotkey, useHotkeys } from "@blueprintjs/core";
import type { SearchCategory } from "components/editorComponents/GlobalSearch/utils";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import { redoAction, undoAction } from "actions/pageActions";
import { runActionViaShortcut } from "actions/pluginActionActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { getSelectedText, isMacOrIOS } from "utils/helpers";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { resetSnipingMode as resetSnipingModeAction } from "actions/propertyPaneActions";
import {
  closePropertyPane,
  closeTableFilterPane,
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
  groupWidgets,
  pasteWidget,
} from "actions/widgetActions";
import { getAppMode } from "ee/selectors/applicationSelectors";
import type { APP_MODE } from "entities/App";
import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "ee/constants/messages";
import { previewModeSelector } from "selectors/editorSelectors";
import { matchBuilderPath } from "constants/routes";
import { toggleInstaller } from "actions/JSLibraryActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { toast } from "@appsmith/ads";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setPreviewModeInitAction } from "actions/editorActions";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import {
  selectGitApplicationProtectedMode,
  selectGitModEnabled,
} from "selectors/gitModSelectors";
import { GitHotKeys as GitHotKeysNew } from "git";

function GitHotKeys() {
  const isGitModEnabled = useSelector(selectGitModEnabled);
  const dispatch = useDispatch();

  const showCommitModal = useCallback(() => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.DEPLOY,
      }),
    );
  }, [dispatch]);

  return isGitModEnabled ? (
    <GitHotKeysNew />
  ) : (
    <Hotkey
      combo="ctrl + shift + g"
      global
      label="Show git commit modal"
      onKeyDown={showCommitModal}
    />
  );
}

interface Props {
  copySelectedWidget: () => void;
  pasteCopiedWidget: (mouseLocation: { x: number; y: number }) => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  groupSelectedWidget: () => void;
  setGlobalSearchCategory: (category: SearchCategory) => void;
  resetSnipingMode: () => void;
  closeProppane: () => void;
  closeTableFilterProppane: () => void;
  executeAction: () => void;
  selectAllWidgetsInit: () => void;
  deselectAllWidgets: () => void;
  selectedWidget?: string;
  selectedWidgets: string[];
  isDebuggerOpen: boolean;
  children: React.ReactNode;
  undo: () => void;
  redo: () => void;
  appMode?: APP_MODE;
  isPreviewMode: boolean;
  isProtectedMode: boolean;
  setPreviewModeInitAction: (shouldSet: boolean) => void;
  isSignpostingEnabled: boolean;
  getMousePosition: () => { x: number; y: number };
  hideInstaller: () => void;
  toggleDebugger: () => void;
}

function GlobalHotKeys(props: Props) {
  const stopPropagationIfWidgetSelected = useCallback(
    (e: KeyboardEvent): boolean => {
      const selectedText = getSelectedText();

      if (selectedText) {
        return false;
      }

      return true;
    },
    [],
  );

  const shouldStopPropagation = useMemo((): boolean => {
    const selectedText = getSelectedText();

    if (selectedText) {
      return false;
    }

    return true;
  }, []);

  const onOnmnibarHotKeyDown = useCallback(
    (
      e: KeyboardEvent,
      categoryId: SEARCH_CATEGORY_ID = SEARCH_CATEGORY_ID.NAVIGATION,
    ) => {
      e.preventDefault();

      if (props.isPreviewMode) return;

      props.setGlobalSearchCategory(filterCategories[categoryId]);

      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "HOTKEY_COMBO",
        category: categoryId,
      });
    },
    [props.isPreviewMode, props.setGlobalSearchCategory],
  );

  const hotkeys = React.useMemo(
    () => [
      {
        combo: "mod+f",
        global: true,
        label: "Search entities",
        onKeyDown: (e: KeyboardEvent) => {
          onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.NAVIGATION);
        },
        stopPropagation: shouldStopPropagation,
      },
      {
        combo: "mod+p",
        global: true,
        label: "Navigate",
        onKeyDown: (e: KeyboardEvent) => {
          onOnmnibarHotKeyDown(e);
        },
        stopPropagation: shouldStopPropagation,
      },
      {
        combo: "mod+plus",
        global: true,
        label: "Create new",
        onKeyDown: (e: KeyboardEvent) => {
          onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.ACTION_OPERATION);
        },
        stopPropagation: shouldStopPropagation,
      },
      {
        combo: "mod+k",
        global: true,
        label: "Show omnibar",
        onKeyDown: (e: KeyboardEvent) => {
          onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.INIT);
        },
        stopPropagation: shouldStopPropagation,
      },
      {
        combo: "mod+d",
        global: true,
        group: "Canvas",
        label: "Open Debugger",
        onKeyDown: props.toggleDebugger,
        preventDefault: true,
      },
      {
        combo: "mod+c",
        global: true,
        group: "Canvas",
        label: "Copy widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (stopPropagationIfWidgetSelected(e)) {
            props.copySelectedWidget();
          }
        },
      },
      {
        combo: "mod+v",
        global: true,
        group: "Canvas",
        label: "Paste Widget",
        onKeyDown: () => {
          if (matchBuilderPath(window.location.pathname)) {
            props.pasteCopiedWidget(props.getMousePosition() || { x: 0, y: 0 });
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
            props.deleteSelectedWidget();
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
            props.deleteSelectedWidget();
          }
        },
      },
      {
        combo: "mod+x",
        global: true,
        group: "Canvas",
        label: "Cut Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (stopPropagationIfWidgetSelected(e)) {
            props.cutSelectedWidget();
          }
        },
      },
      {
        combo: "mod+a",
        global: true,
        group: "Canvas",
        label: "Select all Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (matchBuilderPath(window.location.pathname)) {
            props.selectAllWidgetsInit();
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
          props.resetSnipingMode();

          if (matchBuilderPath(window.location.pathname)) {
            props.deselectAllWidgets();
            props.closeProppane();
            props.closeTableFilterProppane();
          }

          e.preventDefault();
        },
      },
      {
        combo: "v",
        global: true,
        label: "Edit Mode",
        onKeyDown: (e: KeyboardEvent) => {
          props.resetSnipingMode();
          e.preventDefault();
        },
      },
      {
        combo: "mod+enter",
        global: true,
        label: "Execute Action",
        onKeyDown: props.executeAction,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod+z",
        global: true,
        label: "Undo change in canvas",
        onKeyDown: props.undo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod+shift+z",
        global: true,
        label: "Redo change in canvas",
        onKeyDown: props.redo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod+y",
        global: true,
        label: "Redo change in canvas",
        onKeyDown: props.redo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod+g",
        global: true,
        group: "Canvas",
        label: "Cut Widgets for grouping",
        onKeyDown: (e: KeyboardEvent) => {
          if (stopPropagationIfWidgetSelected(e)) {
            props.groupSelectedWidget();
          }
        },
      },
      {
        combo: "mod+s",
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
        combo: "alt+p",
        global: true,
        label: "Preview Mode",
        onKeyDown: () => {
          props.setPreviewModeInitAction(!props.isPreviewMode);
        },
      },
    ],
    [onOnmnibarHotKeyDown, stopPropagationIfWidgetSelected, props],
  );

  // Register hotkeys using the useHotkeys hook
  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{ height: "100%" }}
    >
      {props.children}
      <GitHotKeys />
    </div>
  );
}

const mapStateToProps = (state: AppState) => {
  return {
    selectedWidget: getLastSelectedWidget(state),
    selectedWidgets: getSelectedWidgets(state),
    isDebuggerOpen: showDebuggerFlag(state),
    appMode: getAppMode(state),
    isPreviewMode: previewModeSelector(state),
    isProtectedMode: selectGitApplicationProtectedMode(state),
    isSignpostingEnabled: getIsFirstTimeUserOnboardingEnabled(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    copySelectedWidget: () => dispatch(copyWidget(true)),
    pasteCopiedWidget: (mouseLocation: { x: number; y: number }) =>
      dispatch(
        pasteWidget({
          groupWidgets: false,
          mouseLocation,
        }),
      ),
    deleteSelectedWidget: () => dispatch(deleteSelectedWidget(true)),
    cutSelectedWidget: () => dispatch(cutWidget()),
    groupSelectedWidget: () => dispatch(groupWidgets()),
    setGlobalSearchCategory: (category: SearchCategory) =>
      dispatch(setGlobalSearchCategory(category)),
    resetSnipingMode: () => dispatch(resetSnipingModeAction()),
    closeProppane: () => dispatch(closePropertyPane()),
    closeTableFilterProppane: () => dispatch(closeTableFilterPane()),
    selectAllWidgetsInit: () =>
      dispatch(selectWidgetInitAction(SelectionRequestType.All)),
    deselectAllWidgets: () =>
      dispatch(selectWidgetInitAction(SelectionRequestType.Empty)),
    executeAction: () => dispatch(runActionViaShortcut()),
    undo: () => dispatch(undoAction()),
    redo: () => dispatch(redoAction()),
    hideInstaller: () => dispatch(toggleInstaller(false)),
    setPreviewModeInitAction: (shouldSet: boolean) =>
      dispatch(setPreviewModeInitAction(shouldSet)),
  };
};

GlobalHotKeys.contextType = WalkthroughContext;

export default connect(mapStateToProps, mapDispatchToProps)(GlobalHotKeys);
