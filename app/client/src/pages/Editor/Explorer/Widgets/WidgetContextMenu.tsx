import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { ContextMenuPopoverModifiers } from "../helpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { noop } from "lodash";
import { initExplorerEntityNameEdit } from "actions/explorerActions";

export const WidgetContextMenu = (props: {
  widgetId: string;
  parentId: string;
  className?: string;
}) => {
  const { parentId, widgetId } = props;
  const dispatch = useDispatch();
  const dispatchDelete = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.WIDGET_DELETE,
      payload: {
        widgetId,
        parentId,
      },
    });
  }, [dispatch, widgetId, parentId]);

  const editWidgetName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(widgetId)),
    [dispatch, widgetId],
  );

  return (
    <TreeDropdown
      className={props.className}
      modifiers={ContextMenuPopoverModifiers}
      defaultText=""
      onSelect={noop}
      selectedValue=""
      optionTree={[
        {
          value: "rename",
          onSelect: editWidgetName,
          label: "Edit Name",
        },
        {
          value: "delete",
          onSelect: dispatchDelete,
          label: "Delete",
          intent: "danger",
        },
      ]}
      toggle={<ContextMenuTrigger />}
    />
  );
};

export default WidgetContextMenu;
