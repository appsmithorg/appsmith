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
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { isMac } from "utils/helpers";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getSelectedText } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WIDGETS_SEARCH_ID } from "constants/Explorer";
import { resetSnipingMode as resetSnipingModeAction } from "actions/propertyPaneActions";
import { showDebugger } from "actions/debuggerActions";

import { setCommentModeInUrl } from "pages/Editor/ToggleModeButton";
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

import { commentModeSelector } from "selectors/commentsSelectors";
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

type Props = {
  copySelectedWidget: () => void;
  pasteCopiedWidget: () => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  groupSelectedWidget: () => void;
  toggleShowGlobalSearchModal: (category: SearchCategory) => void;
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
  isCommentMode: boolean;
  isPreviewMode: boolean;
  setPreviewModeAction: (shouldSet: boolean) => void;
  isExplorerPinned: boolean;
  setExplorerPinnedAction: (shouldPinned: boolean) => void;
  showCommitModal: () => void;
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

  public onOnmnibarHotKeyDown(
    e: KeyboardEvent,
    categoryId: SEARCH_CATEGORY_ID = SEARCH_CATEGORY_ID.NAVIGATION,
  ) {
    e.preventDefault();

    // don't open omnibar if preview mode is on
    if (this.props.isPreviewMode) return;

    const category = filterCategories[categoryId];
    this.props.toggleShowGlobalSearchModal(category);
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "HOTKEY_COMBO",
      category: category.title,
    });
  }

  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          combo="mod + f"
          global
          label="Search entities"
          onKeyDown={(e: any) => {
            const widgetSearchInput = document.getElementById(
              WIDGETS_SEARCH_ID,
            );
            if (widgetSearchInput) {
              widgetSearchInput.focus();
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
        <Hotkey
          allowInInput
          combo="mod + p"
          global
          label="Navigate"
          onKeyDown={(e) => this.onOnmnibarHotKeyDown(e)}
        />
        <Hotkey
          allowInInput
          combo="alt + shift + n"
          global
          label="Create New"
          onKeyDown={(e) =>
            this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.ACTION_OPERATION)
          }
        />
        <Hotkey
          allowInInput
          combo="mod + j"
          global
          label="Lookup code snippets"
          onKeyDown={(e) => {
            this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.SNIPPETS);
            AnalyticsUtil.logEvent("SNIPPET_LOOKUP", {
              source: "HOTKEY_COMBO",
            });
          }}
        />
        <Hotkey
          allowInInput
          combo="mod + l"
          global
          label="Search documentation"
          onKeyDown={(e) =>
            this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.DOCUMENTATION)
          }
        />
        <Hotkey
          allowInInput
          combo="mod + k"
          global
          label="Show omnibar"
          onKeyDown={(e) =>
            this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.INIT)
          }
        />
        <Hotkey
          allowInInput
          combo="mod + d"
          global
          group="Canvas"
          label="Open Debugger"
          onKeyDown={() => {
            this.props.openDebugger();
            if (this.props.isDebuggerOpen) {
              AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
                source: "CANVAS",
              });
            }
          }}
          preventDefault
        />
        <Hotkey
          combo="mod + c"
          global
          group="Canvas"
          label="Copy Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.copySelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + v"
          global
          group="Canvas"
          label="Paste Widget"
          onKeyDown={() => {
            this.props.pasteCopiedWidget();
          }}
        />
        <Hotkey
          combo="backspace"
          global
          group="Canvas"
          label="Delete Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e) && isMac()) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="del"
          global
          group="Canvas"
          label="Delete Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + x"
          global
          group="Canvas"
          label="Cut Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.cutSelectedWidget();
            }
          }}
        />

        <Hotkey
          combo="mod + a"
          global
          group="Canvas"
          label="Select all Widget"
          onKeyDown={(e: any) => {
            this.props.selectAllWidgetsInit();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="esc"
          global
          group="Canvas"
          label="Deselect all Widget"
          onKeyDown={(e: any) => {
            if (this.props.isCommentMode) {
              AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                mode: this.props.appMode,
                source: "HOTKEY",
                combo: "esc",
              });
              setCommentModeInUrl(false);
            }
            this.props.resetSnipingMode();
            this.props.deselectAllWidgets();
            this.props.closeProppane();
            this.props.closeTableFilterProppane();
            e.preventDefault();
            this.props.setPreviewModeAction(false);
          }}
        />
        <Hotkey
          combo="v"
          global
          label="Edit Mode"
          onKeyDown={(e: any) => {
            if (this.props.isCommentMode)
              AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                mode: this.props.appMode,
                source: "HOTKEY",
                combo: "v",
              });
            setCommentModeInUrl(false);
            this.props.resetSnipingMode();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="c"
          global
          label="Comment Mode"
          onKeyDown={() => {
            if (!this.props.isCommentMode)
              AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                mode: "COMMENT",
                source: "HOTKEY",
                combo: "c",
              });
            setCommentModeInUrl(true);
          }}
        />
        <Hotkey
          allowInInput
          combo="mod + enter"
          global
          label="Execute Action"
          onKeyDown={this.props.executeAction}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="mod + z"
          global
          label="Undo change in canvas"
          onKeyDown={this.props.undo}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="mod + shift + z"
          global
          label="Redo change in canvas"
          onKeyDown={this.props.redo}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="mod + y"
          global
          label="Redo change in canvas"
          onKeyDown={this.props.redo}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="mod + g"
          global
          group="Canvas"
          label="Cut Widgets for grouping"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.groupSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + s"
          global
          label="Save progress"
          onKeyDown={() => {
            Toaster.show({
              text: createMessage(SAVE_HOTKEY_TOASTER_MESSAGE),
              variant: Variant.info,
            });
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="p"
          global
          label="Preview Mode"
          onKeyDown={() => {
            setCommentModeInUrl(false);
            this.props.setPreviewModeAction(!this.props.isPreviewMode);
          }}
        />
        <Hotkey
          combo="mod + /"
          global
          label="Pin/Unpin Entity Explorer"
          onKeyDown={() => {
            this.props.setExplorerPinnedAction(!this.props.isExplorerPinned);
          }}
        />
        <Hotkey
          combo="ctrl + shift + g"
          global
          label="Show git commit modal"
          onKeyDown={() => {
            this.props.showCommitModal();
          }}
        />
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
  isCommentMode: commentModeSelector(state),
  isPreviewMode: previewModeSelector(state),
  isExplorerPinned: getExplorerPinned(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    copySelectedWidget: () => dispatch(copyWidget(true)),
    pasteCopiedWidget: () => dispatch(pasteWidget()),
    deleteSelectedWidget: () => dispatch(deleteSelectedWidget(true)),
    cutSelectedWidget: () => dispatch(cutWidget()),
    groupSelectedWidget: () => dispatch(groupWidgets()),
    toggleShowGlobalSearchModal: (category: SearchCategory) =>
      dispatch(toggleShowGlobalSearchModal(category)),
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
