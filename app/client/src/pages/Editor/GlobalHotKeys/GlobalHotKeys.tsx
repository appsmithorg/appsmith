import React from "react";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core";
import {
  closePropertyPane,
  closeTableFilterPane,
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
  groupWidgets,
  pasteWidget,
} from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { getSelectedText, isMacOrIOS } from "utils/helpers";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
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

import { getAppMode } from "ee/selectors/applicationSelectors";
import type { APP_MODE } from "entities/App";

import {
  createMessage,
  SAVE_HOTKEY_TOASTER_MESSAGE,
} from "ee/constants/messages";
import { previewModeSelector } from "selectors/editorSelectors";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { matchBuilderPath } from "constants/routes";
import { toggleInstaller } from "actions/JSLibraryActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { toast } from "@appsmith/ads";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";

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
  showCommitModal: () => void;
  getMousePosition: () => { x: number; y: number };
  hideInstaller: () => void;
  toggleDebugger: () => void;
}

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

    this.props.setGlobalSearchCategory(category);
    this.props.hideInstaller();
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "HOTKEY_COMBO",
      category: category.title,
    });
  }

  public renderHotkeys() {
    const { isOpened: isWalkthroughOpened } = this.context ?? {};
    const { isProtectedMode } = this.props;

    // If walkthrough is open disable shortcuts
    if (isWalkthroughOpened || isProtectedMode) return <Hotkeys />;

    return (
      <Hotkeys>
        <Hotkey
          combo="mod + f"
          global
          label="Search entities"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e: any) => {
            const widgetSearchInput =
              document.getElementById(WIDGETS_SEARCH_ID);

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
          combo="mod + plus"
          global
          label="Create new"
          onKeyDown={(e) =>
            this.onOnmnibarHotKeyDown(e, SEARCH_CATEGORY_ID.ACTION_OPERATION)
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
          onKeyDown={this.props.toggleDebugger}
          preventDefault
        />
        <Hotkey
          combo="mod + c"
          global
          group="Canvas"
          label="Copy widget"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            if (matchBuilderPath(window.location.pathname)) {
              this.props.pasteCopiedWidget(
                this.props.getMousePosition() || { x: 0, y: 0 },
              );
            }
          }}
        />
        <Hotkey
          combo="backspace"
          global
          group="Canvas"
          label="Delete widget"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e) && isMacOrIOS()) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="del"
          global
          group="Canvas"
          label="Delete widget"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e: any) => {
            if (matchBuilderPath(window.location.pathname)) {
              this.props.selectAllWidgetsInit();
              e.preventDefault();
            }
          }}
        />
        <Hotkey
          combo="esc"
          global
          group="Canvas"
          label="Deselect all Widget"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e: any) => {
            this.props.resetSnipingMode();

            if (matchBuilderPath(window.location.pathname)) {
              this.props.deselectAllWidgets();
              this.props.closeProppane();
              this.props.closeTableFilterProppane();
            }

            e.preventDefault();
          }}
        />
        <Hotkey
          combo="v"
          global
          label="Edit Mode"
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onKeyDown={(e: any) => {
            this.props.resetSnipingMode();
            e.preventDefault();
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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            toast.show(createMessage(SAVE_HOTKEY_TOASTER_MESSAGE), {
              kind: "info",
            });
          }}
          preventDefault
          stopPropagation
        />
        <Hotkey
          combo="alt + p"
          global
          label="Preview Mode"
          onKeyDown={() => {
            this.props.setPreviewModeInitAction(!this.props.isPreviewMode);
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
  selectedWidget: getLastSelectedWidget(state),
  selectedWidgets: getSelectedWidgets(state),
  isDebuggerOpen: showDebuggerFlag(state),
  appMode: getAppMode(state),
  isPreviewMode: previewModeSelector(state),
  isProtectedMode: protectedModeSelector(state),
  isSignpostingEnabled: getIsFirstTimeUserOnboardingEnabled(state),
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    showCommitModal: () =>
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.DEPLOY,
        }),
      ),
    hideInstaller: () => dispatch(toggleInstaller(false)),
    setPreviewModeInitAction: (shouldSet: boolean) =>
      dispatch(setPreviewModeInitAction(shouldSet)),
  };
};

GlobalHotKeys.contextType = WalkthroughContext;

export default connect(mapStateToProps, mapDispatchToProps)(GlobalHotKeys);
