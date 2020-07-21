import React from "react";
import { useDispatch } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import ContextMenuTrigger from "../ContextMenuTrigger";
import { noop } from "lodash";
import { ContextMenuPopoverModifiers } from "../helpers";

export const DataSourceContextMenu = (props: {
  datasourceId: string;
  className?: string;
}) => {
  const dispatch = useDispatch();
  const dispatchDelete = (datasourceId: string) => {
    dispatch(deleteDatasource({ id: datasourceId }));
  };
  return (
    <TreeDropdown
      className={props.className}
      modifiers={ContextMenuPopoverModifiers}
      defaultText=""
      onSelect={noop}
      selectedValue=""
      optionTree={[
        {
          value: "delete",
          onSelect: () => dispatchDelete(props.datasourceId),
          label: "Delete",
          intent: "danger",
        },
      ]}
      toggle={<ContextMenuTrigger />}
    />
  );
};

export default DataSourceContextMenu;
