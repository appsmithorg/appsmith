import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import {
  closePropertyPane,
  closeTableFilterPane,
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
  groupWidgets,
  pasteWidget,
} from "actions/widgetActions";
import {
  deselectAllInitAction,
  selectAllWidgetsInCanvasInitAction,
} from "actions/widgetSelectionActions";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { isMacOrIOS } from "utils/helpers";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getSelectedText } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WIDGETS_SEARCH_ID } from "constants/Explorer";
import { resetSnipingMode as resetSnipingModeAction } from "actions/propertyPaneActions";
import { showDebugger } from "actions/debuggerActions";

import { runActionViaShortcut } from "actions/pluginActionActions";
import {
  filterCategories,
  SearchCategory,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import { redoAction, undoAction } from "actions/pageActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";

import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "@appsmith/constants/messages";
import { setPreviewModeAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinnedAction } from "actions/explorerActions";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { matchBuilderPath, matchGeneratePagePath } from "constants/routes";
import { IHotkeyProps } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkey";

type Props = {
  copySelectedWidget: () => void;
  pasteCopiedWidget: (mouseLocation: { x: number; y: number }) => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  groupSelectedWidget: () => void;
  setGlobalSearchCategory: (category: SearchCategory) => void;
  resetSnipingMode: () => void;
  openDebugger: () => void;
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
  setPreviewModeAction: (shouldSet: boolean) => void;
  isExplorerPinned: boolean;
  setExplorerPinnedAction: (shouldPinned: boolean) => void;
  showCommitModal: () => void;
  getMousePosition: () => { x: number; y: number };
};

@HotkeysTarget
class GlobalHotKeys extends React.Component<Props> {
  public stopPropagationIfWidgetSelected(e: KeyboardEvent): boolean {
    const multipleWidgetsSelected =
      this.props.selectedWidgets && this.props.selectedWidgets.length;
    const singleWidgetSelected =
      this.props.selectedWidget &&
      this.props.selectedWidget != MAIN_CONTAINER_WIDGET_ID;
    if (
      (singleWidgetSelected || multipleWidgetsSelected) &&
      !getSelectedText()
    ) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    return false;
  }

  get hotkeysConfig(): IHotkeyProps[] {
    return [
      {
        combo: "mod + f",
        global: true,
        label: "Search entities",
        onKeyDown: (e: KeyboardEvent) => {
          const widgetSearchInput = document.getElementById(WIDGETS_SEARCH_ID);
          if (widgetSearchInput) {
            widgetSearchInput.focus();
            e.preventDefault();
            e.stopPropagation();
          }
        },
      },
      {
        allowInInput: true,
        combo: "mod + p",
        global: true,
        label: "Navigate",
        onKeyDown: (e: KeyboardEvent) => this.onOnmnibarHotKeyDown(e),
      },
      {
        allowInInput: true,
        combo: "mod + plus",
        global: true,
        label: "Create New",
        onKeyDown: (e: KeyboardEvent) =>
          this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.ACTION_OPERATION),
      },
      {
        allowInInput: true,
        combo: "mod + j",
        global: true,
        label: "Lookup code snippets",
        onKeyDown: (e: KeyboardEvent) => {
          this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.SNIPPETS);
          AnalyticsUtil.logEvent("SNIPPET_LOOKUP", {
            source: "HOTKEY_COMBO",
          });
        },
      },
      {
        allowInInput: true,
        combo: "mod + l",
        global: true,
        label: "Search documentation",
        onKeyDown: (e: KeyboardEvent) =>
          this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.DOCUMENTATION),
      },
      {
        allowInInput: true,
        combo: "mod + k",
        global: true,
        label: "Show omnibar",
        onKeyDown: (e: KeyboardEvent) =>
          this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.INIT),
      },
      {
        allowInInput: true,
        combo: "mod + d",
        global: true,
        group: "Canvas",
        label: "Open Debugger",
        onKeyDown: () => {
          this.props.openDebugger();
          if (this.props.isDebuggerOpen) {
            AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
              source: "CANVAS",
            });
          }
        },
        preventDefault: true,
      },
      {
        combo: "mod + c",
        global: true,
        group: "Canvas",
        label: "Copy Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (this.stopPropagationIfWidgetSelected(e)) {
            this.props.copySelectedWidget();
          }
        },
      },
      {
        combo: "mod + v",
        global: true,
        group: "Canvas",
        label: "Paste Widget",
        onKeyDown: () => {
          if (
            matchBuilderPath(window.location.pathname) ||
            matchGeneratePagePath(window.location.pathname)
          ) {
            this.props.pasteCopiedWidget(
              this.props.getMousePosition() || { x: 0, y: 0 },
            );
          }
        },
      },
      {
        combo: "backspace",
        global: true,
        group: "Canvas",
        label: "Delete Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (this.stopPropagationIfWidgetSelected(e) && isMacOrIOS()) {
            this.props.deleteSelectedWidget();
          }
        },
      },
      {
        combo: "del",
        global: true,
        group: "Canvas",
        label: "Delete Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (this.stopPropagationIfWidgetSelected(e)) {
            this.props.deleteSelectedWidget();
          }
        },
      },
      {
        combo: "mod + x",
        global: true,
        group: "Canvas",
        label: "Cut Widget",
        onKeyDown: (e: KeyboardEvent) => {
          if (this.stopPropagationIfWidgetSelected(e)) {
            this.props.cutSelectedWidget();
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
            this.props.selectAllWidgetsInit();
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
          this.props.resetSnipingMode();
          this.props.deselectAllWidgets();
          this.props.closeProppane();
          this.props.closeTableFilterProppane();
          e.preventDefault();
          this.props.setPreviewModeAction(false);
        },
      },
      {
        combo: "v",
        global: true,
        label: "Edit Mode",
        onKeyDown: (e: KeyboardEvent) => {
          this.props.resetSnipingMode();
          e.preventDefault();
        },
      },
      {
        allowInInput: true,
        combo: "mod + enter",
        global: true,
        label: "Execute Action",
        onKeyDown: this.props.executeAction,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod + z",
        global: true,
        label: "Undo change in canvas",
        onKeyDown: this.props.undo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod + shift + z",
        global: true,
        label: "Redo change in canvas",
        onKeyDown: this.props.redo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod + y",
        global: true,
        label: "Redo change in canvas",
        onKeyDown: this.props.redo,
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "mod + g",
        global: true,
        group: "Canvas",
        label: "Cut Widgets for grouping",
        onKeyDown: (e: KeyboardEvent) => {
          if (this.stopPropagationIfWidgetSelected(e)) {
            this.props.groupSelectedWidget();
          }
        },
      },
      {
        combo: "mod + s",
        global: true,
        label: "Save progress",
        onKeyDown: () => {
          Toaster.show({
            text: createMessage(SAVE_HOTKEY_TOASTER_MESSAGE),
            variant: Variant.info,
          });
        },
        preventDefault: true,
        stopPropagation: true,
      },
      {
        combo: "p",
        global: true,
        label: "Preview Mode",
        onKeyDown: () => {
          this.props.setPreviewModeAction(!this.props.isPreviewMode);
        },
      },
      {
        combo: "mod + /",
        global: true,
        label: "Pin/Unpin Entity Explorer",
        onKeyDown: () => {
          this.props.setExplorerPinnedAction(!this.props.isExplorerPinned);
        },
      },
      {
        combo: "ctrl + shift + g",
        global: true,
        label: "Show git commit modal",
        onKeyDown: () => {
          this.props.showCommitModal();
        },
      },
    ];
  }

  public onOnmnibarHotKeyDown(
    e: KeyboardEvent,
    categoryId: SEARCH_CATEGORY_ID = SEARCH_CATEGORY_ID.NAVIGATION,
  ) {
    e.preventDefault();

    // don't open omnibar if preview mode is on
    if (this.props.isPreviewMode) return;

    const category = filterCategories[categoryId];
    this.props.setGlobalSearchCategory(category);
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "HOTKEY_COMBO",
      category: category.title,
    });
  }

  public renderHotkeys() {
    return (
      <Hotkeys>
        {this.hotkeysConfig.map((config) => (
          <Hotkey key={config.combo} {...config} />
        ))}
      </Hotkeys>
    );
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

const mapStateToProps = (state: AppState) => ({
  selectedWidget: getSelectedWidget(state),
  selectedWidgets: getSelectedWidgets(state),
  isDebuggerOpen: state.ui.debugger.isOpen,
  appMode: getAppMode(state),
  isPreviewMode: previewModeSelector(state),
  isExplorerPinned: getExplorerPinned(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    copySelectedWidget: () => dispatch(copyWidget(true)),
    pasteCopiedWidget: (mouseLocation: { x: number; y: number }) =>
      dispatch(pasteWidget(false, mouseLocation)),
    deleteSelectedWidget: () => dispatch(deleteSelectedWidget(true)),
    cutSelectedWidget: () => dispatch(cutWidget()),
    groupSelectedWidget: () => dispatch(groupWidgets()),
    setGlobalSearchCategory: (category: SearchCategory) =>
      dispatch(setGlobalSearchCategory(category)),
    resetSnipingMode: () => dispatch(resetSnipingModeAction()),
    openDebugger: () => dispatch(showDebugger()),
    closeProppane: () => dispatch(closePropertyPane()),
    closeTableFilterProppane: () => dispatch(closeTableFilterPane()),
    selectAllWidgetsInit: () => dispatch(selectAllWidgetsInCanvasInitAction()),
    deselectAllWidgets: () => dispatch(deselectAllInitAction()),
    executeAction: () => dispatch(runActionViaShortcut()),
    undo: () => dispatch(undoAction()),
    redo: () => dispatch(redoAction()),
    setPreviewModeAction: (shouldSet: boolean) =>
      dispatch(setPreviewModeAction(shouldSet)),
    setExplorerPinnedAction: (shouldSet: boolean) =>
      dispatch(setExplorerPinnedAction(shouldSet)),
    showCommitModal: () =>
      dispatch(
        setIsGitSyncModalOpen({ isOpen: true, tab: GitSyncModalTab.DEPLOY }),
      ),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalHotKeys);
