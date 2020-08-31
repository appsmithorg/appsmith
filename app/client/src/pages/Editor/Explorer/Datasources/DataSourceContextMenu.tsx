import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { noop } from "lodash";
import { ContextMenuPopoverModifiers } from "../helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";

export const DataSourceContextMenu = (props: {
  datasourceId: string;
  className?: string;
}) => {
  const dispatch = useDispatch();
  const dispatchDelete = useCallback(() => {
    dispatch(deleteDatasource({ id: props.datasourceId }));
  }, [dispatch, props.datasourceId]);
  const editDatasourceName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.datasourceId)),
    [dispatch, props.datasourceId],
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
          onSelect: editDatasourceName,
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

export default DataSourceContextMenu;
