import React from "react";
import { useDispatch } from "react-redux";
import { deleteDatasource } from "actions/datasourceActions";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import { ControlIcons } from "icons/ControlIcons";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { noop } from "lodash";
import { EntityTogglesWrapper } from "./ExplorerStyledComponents";

export const DataSourceContextMenu = (props: {
  datasourceId: string;
  theme: Theme;
  className?: string;
}) => {
  const dispatch = useDispatch();
  const dispatchDelete = (datasourceId: string) => {
    dispatch(deleteDatasource({ id: datasourceId }));
  };
  return (
    <TreeDropdown
      className={props.className}
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
      toggle={
        <EntityTogglesWrapper>
          <ControlIcons.MORE_VERTICAL_CONTROL
            width={props.theme.fontSizes[3]}
            height={props.theme.fontSizes[3]}
          />
        </EntityTogglesWrapper>
      }
    />
  );
};

export default withTheme(DataSourceContextMenu);
