import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { TreeDropdownOption } from "pages/Editor/Explorer/TreeDropdown";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { ContextMenuPopoverModifiers } from "@appsmith/pages/Editor/Explorer/helpers";
import { noop } from "lodash";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import type { AppState } from "@appsmith/reducers";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import WidgetFactory from "utils/WidgetFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { inGuidedTour } from "selectors/onboardingSelectors";
const WidgetTypes = WidgetFactory.widgetTypes;

export function WidgetContextMenu(props: {
  widgetId: string;
  pageId: string;
  className?: string;
  canManagePages?: boolean;
}) {
  const { widgetId } = props;
  const parentId = useSelector((state: AppState) => {
    return state.ui.pageWidgets[props.pageId][props.widgetId].parentId;
  });
  const widget = useSelector((state: AppState) => {
    return state.ui.pageWidgets[props.pageId][props.widgetId];
  });

  const parentWidget: any = useSelector((state: AppState) => {
    if (parentId) return state.ui.pageWidgets[props.pageId][parentId];
    return {};
  });
  const guidedTourEnabled = useSelector(inGuidedTour);
  const dispatch = useDispatch();
  const dispatchDelete = useCallback(() => {
    // If the widget is a tab we are updating the `tabs` of the property of the widget
    // This is similar to deleting a tab from the property pane
    if (widget.tabName && parentWidget.type === WidgetTypes.TABS_WIDGET) {
      const tabsObj = { ...parentWidget.tabsObj };
      const filteredTabs = Object.values(tabsObj);
      if (widget.parentId && !!filteredTabs.length) {
        dispatch({
          type: ReduxActionTypes.WIDGET_DELETE_TAB_CHILD,
          payload: { ...tabsObj[widget.tabId] },
        });
      }
      return;
    }

    dispatch({
      type: WidgetReduxActionTypes.WIDGET_DELETE,
      payload: {
        widgetId,
        parentId,
      },
    });
  }, [dispatch, widgetId, parentId, widget, parentWidget]);

  const showBinding = useCallback(
    (widgetId, widgetName) =>
      dispatch({
        type: ReduxActionTypes.SET_ENTITY_INFO,
        payload: {
          entityId: widgetId,
          entityName: widgetName,
          entityType: ENTITY_TYPE.WIDGET,
          show: true,
        },
      }),
    [],
  );

  const editWidgetName = useCallback(() => {
    if (guidedTourEnabled) {
      dispatch(toggleShowDeviationDialog(true));
      return;
    }
    dispatch(initExplorerEntityNameEdit(widgetId));
  }, [dispatch, widgetId, guidedTourEnabled]);

  const optionTree: TreeDropdownOption[] = [
    {
      value: "showBinding",
      onSelect: () => showBinding(props.widgetId, widget.widgetName),
      label: "Show Bindings",
    },
  ];

  if (props.canManagePages) {
    const option: TreeDropdownOption = {
      value: "rename",
      onSelect: editWidgetName,
      label: "Edit Name",
    };
    optionTree.push(option);
  }

  if (widget.isDeletable !== false && props.canManagePages) {
    const option: TreeDropdownOption = {
      value: "delete",
      onSelect: dispatchDelete,
      label: "Delete",
      intent: "danger",
    };

    optionTree.push(option);
  }
  return optionTree.length > 0 ? (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={optionTree as TreeDropdownOption[]}
      selectedValue=""
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  ) : null;
}

WidgetContextMenu.displayName = "WidgetContextMenu";

export default WidgetContextMenu;
