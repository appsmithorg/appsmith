import type { KeyboardEvent } from "./HotkeysDialog";
import { useDispatch, useSelector } from "react-redux";
import { toggleInstaller } from "actions/JSLibraryActions";
import { setPreviewModeAction } from "actions/editorActions";
import { getExplorerPinned } from "selectors/explorerSelector";
import { previewModeSelector } from "selectors/editorSelectors";
import { setExplorerActiveAction } from "actions/explorerActions";
import { setGlobalSearchCategory } from "actions/globalSearchActions";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { filterCategories } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_CATEGORY_ID } from "components/editorComponents/GlobalSearch/utils";
import { matchBuilderPath } from "constants/routes";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
} from "actions/widgetActions";
import { getLastSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getSelectedText, isMacOrIOS } from "utils/helpers";

export const useHotKeysConfig = () => {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const isExplorerPinned = useSelector(getExplorerPinned);
  const selectedWidgets = useSelector(getSelectedWidgets);
  const selectedWidget = useSelector(getLastSelectedWidget);

  /**
   * toggle omnibar with a category
   * category can be init, page, api, query, action, datasource, widget, js
   *
   * @param e
   * @param categoryID
   * @returns
   */
  const toggleOmnibar = (
    categoryID: SEARCH_CATEGORY_ID = SEARCH_CATEGORY_ID.NAVIGATION,
  ) => {
    if (isPreviewMode) return;

    const category = filterCategories[categoryID];

    dispatch(setGlobalSearchCategory(category));
    dispatch(toggleInstaller(false));
  };

  /**
   * (Pawan): i have no idea what this does
   *
   * @param e
   * @returns
   */
  const stopPropagationIfWidgetSelected = (e: KeyboardEvent) => {
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
  };

  return [
    {
      id: "TOGGLE_OMNIBAR",
      label: "Toggle omnibar",
      hotkey: "mod + K",
      action: () => {
        toggleOmnibar(SEARCH_CATEGORY_ID.INIT);
      },
    },
    {
      id: "NAVIGATE_OMNIBAR",
      label: "Navigate",
      hotkey: "mod + P",
      action: () => {
        toggleOmnibar();
      },
    },
    {
      id: "CREATE_NEQ_OMNIBAR",
      label: "Create new",
      hotkey: "mod + +",
      action: () => {
        toggleOmnibar(SEARCH_CATEGORY_ID.ACTION_OPERATION);
      },
    },
    {
      id: "TOGGLE_OMNIBAR_PAGE",
      label: "Toggle app settings",
      hotkey: "mod + ,",
      action: () => {
        dispatch(openAppSettingsPaneAction());
      },
    },
    {
      id: "TOGGLE_PREVIEW_MODE",
      label: "Toggle Preview Mode",
      hotkey: "P",
      action: () => {
        dispatch(setPreviewModeAction(!isPreviewMode));
      },
    },
    {
      id: "TOGGLE_ENTITY_EXPLORER",
      label: "Pin/Unpin Entity Explorer",
      hotkey: "mod + /",
      action: () => {
        dispatch(setExplorerActiveAction(!isExplorerPinned));
        dispatch(toggleInstaller(false));
      },
    },
    {
      id: "SELECT_ALL_WIDGETS",
      label: "Select all widgets",
      hotkey: "mod + A",
      action: () => {
        if (matchBuilderPath(window.location.pathname)) {
          dispatch(selectWidgetInitAction(SelectionRequestType.All));
        }
      },
    },
    {
      id: "DELETE_SELECTED_WIDGET_BY_BACKSPACE",
      label: "Delete selected widgets",
      hotkey: "backspace",
      action: (e: KeyboardEvent) => {
        if (stopPropagationIfWidgetSelected(e) && isMacOrIOS()) {
          dispatch(deleteSelectedWidget(true));
        }
      },
    },
    {
      id: "DELETE_SELECTED_WIDGETS_BY_DEL",
      label: "Delete selected widgets",
      hotkey: "del",
      action: () => {
        dispatch(deleteSelectedWidget(true));
      },
    },
    {
      id: "CUT_SELECTED_WIDGETS",
      label: "Cut selected widgets",
      hotkey: "mod + x",
      action: (e: KeyboardEvent) => {
        if (stopPropagationIfWidgetSelected(e)) {
          dispatch(cutWidget());
        }
      },
    },
    {
      id: "COPY_SELECTED_WIDGETS",
      label: "Copy selected widgets",
      hotkey: "mod + c",
      action: (e: KeyboardEvent) => {
        if (stopPropagationIfWidgetSelected(e)) {
          dispatch(copyWidget(true));
        }
      },
    },
  ];
};
