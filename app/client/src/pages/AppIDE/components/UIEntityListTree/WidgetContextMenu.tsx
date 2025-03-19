import React, { useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@appsmith/ads";
import { useBoolean } from "usehooks-ts";
import {
  CONTEXT_DELETE,
  CONTEXT_RENAME,
  CONTEXT_SHOW_BINDING,
  createMessage,
} from "ee/constants/messages";
import { useDeleteWidget } from "./hooks/useDeleteWidget";
import { InspectStateMenuItem } from "components/editorComponents/Debugger/StateInspector/CTAs";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import clsx from "clsx";

export const WidgetContextMenu = (props: {
  widgetId: string;
  canManagePages: boolean;
}) => {
  const { canManagePages, widgetId } = props;
  const { toggle: toggleMenuOpen, value: isMenuOpen } = useBoolean(false);
  const dispatch = useDispatch();

  const widget = useSelector(getWidgetByID(widgetId));

  const showBinding = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: {
        entityId: widgetId,
        entityName: widget?.widgetName,
        entityType: ENTITY_TYPE.WIDGET,
        show: true,
      },
    });
  }, [dispatch, widget?.widgetName, widgetId]);

  const editWidgetName = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger
    setTimeout(() => {
      dispatch(initExplorerEntityNameEdit(widgetId));
    }, 100);
  }, [dispatch, widgetId]);

  const deleteWidget = useDeleteWidget(widgetId);

  const handleDeleteWidget = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger which blocks
    // the ability to use keyboard shortcuts on the canvas
    setTimeout(() => {
      deleteWidget();
    }, 0);
  }, [deleteWidget]);

  const menuContent = useMemo(() => {
    return (
      <>
        <MenuItem
          disabled={!canManagePages}
          onClick={editWidgetName}
          startIcon="input-cursor-move"
        >
          {createMessage(CONTEXT_RENAME)}
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={showBinding} startIcon="binding-new">
          {createMessage(CONTEXT_SHOW_BINDING)}
        </MenuItem>
        <InspectStateMenuItem entityId={widgetId} />
        <MenuSeparator />
        <MenuItem
          className="error-menuitem"
          disabled={!canManagePages && widget?.isDeletable !== false}
          onClick={handleDeleteWidget}
          startIcon="trash"
        >
          {createMessage(CONTEXT_DELETE)}
        </MenuItem>
      </>
    );
  }, [
    canManagePages,
    editWidgetName,
    handleDeleteWidget,
    showBinding,
    widget?.isDeletable,
    widgetId,
  ]);

  return (
    <Menu onOpenChange={toggleMenuOpen} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          data-testid="t--entity-context-menu-trigger"
          isIconButton
          kind="tertiary"
          startIcon="more-2-fill"
        />
      </MenuTrigger>
      <MenuContent
        align="start"
        className={clsx(
          "t--entity-context-menu",
          EntityClassNames.CONTEXT_MENU_CONTENT,
        )}
        key={widgetId}
        side="right"
        width="300px"
      >
        {menuContent}
      </MenuContent>
    </Menu>
  );
};
