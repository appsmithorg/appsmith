import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { ContextMenuPopoverModifiers } from "../helpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { noop } from "lodash";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { AppState } from "reducers";

export const WidgetContextMenu = (props: {
  widgetId: string;
  pageId: string;
  className?: string;
}) => {
  const { widgetId } = props;
  const parentId = useSelector((state: AppState) => {
    // console.log(state.ui.pageWidgets[props.pageId], props.widgetId);
    return state.ui.pageWidgets[props.pageId][props.widgetId].parentId;
  });
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
