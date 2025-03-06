import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import type { AppState } from "ee/reducers";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { TreeDropdownOption } from "pages/Editor/Explorer/ContextMenu";
import ContextMenu from "pages/Editor/Explorer/ContextMenu";
import { useDeleteWidget } from "pages/AppIDE/components/UIEntityListTree/hooks/useDeleteWidget";

export function WidgetContextMenu(props: {
  widgetId: string;
  pageId: string;
  className?: string;
  canManagePages?: boolean;
}) {
  const { widgetId } = props;

  const widget = useSelector((state: AppState) => {
    return state.ui.pageWidgets[props.pageId].dsl[props.widgetId];
  });

  const dispatch = useDispatch();

  const deleteWidget = useDeleteWidget(widgetId);

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
      onSelect: deleteWidget,
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
