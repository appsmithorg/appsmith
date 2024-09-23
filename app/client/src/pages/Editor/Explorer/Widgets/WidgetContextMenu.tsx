import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import type { AppState } from "ee/reducers";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import WidgetFactory from "WidgetProvider/factory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
const WidgetTypes = WidgetFactory.widgetTypes;

export function WidgetContextMenu(props: {
  widgetId: string;
  pageId: string;
  className?: string;
  canManagePages?: boolean;
}) {
  const { widgetId } = props;
  const parentId = useSelector((state: AppState) => {
    return state.ui.pageWidgets[props.pageId].dsl[props.widgetId].parentId;
  });
  const widget = useSelector((state: AppState) => {
    return state.ui.pageWidgets[props.pageId].dsl[props.widgetId];
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentWidget: any = useSelector((state: AppState) => {
    if (parentId) return state.ui.pageWidgets[props.pageId].dsl[parentId];

    return {};
  });
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

  const showBinding = useCallback((widgetId, widgetName) => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: {
        entityId: widgetId,
        entityName: widgetName,
        entityType: ENTITY_TYPE.WIDGET,
        show: true,
      },
    });
  }, []);

  const editWidgetName = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(widgetId));
  }, [dispatch, widgetId]);

  const optionTree: TreeDropdownOption[] = [
    {
      value: "showBinding",
      onSelect: () => showBinding(props.widgetId, widget.widgetName),
      label: "Show bindings",
    },
  ];

  if (props.canManagePages) {
    const option: TreeDropdownOption = {
      value: "rename",
      onSelect: editWidgetName,
      label: "Rename",
    };

    optionTree.push(option);
  }

  if (widget.isDeletable !== false && props.canManagePages) {
    const option: TreeDropdownOption = {
      value: "delete",
      onSelect: dispatchDelete,
      label: "Delete",
      intent: "danger",
      confirmDelete: true,
    };

    optionTree.push(option);
  }

  return optionTree.length > 0 ? (
    <ContextMenu
      className={props.className}
      optionTree={optionTree as TreeDropdownOption[]}
    />
  ) : null;
}

WidgetContextMenu.displayName = "WidgetContextMenu";

export default WidgetContextMenu;
