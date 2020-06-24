import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { DropDownWrapper, OptionWrapper } from "./TableStyledWrappers";
import { IconWrapper } from "constants/IconConstants";
import { ReactComponent as VisibilityIcon } from "assets/icons/control/columns-visibility.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";

interface TableColumnsVisibilityProps {
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
}

const TableColumnsVisibility = (props: TableColumnsVisibilityProps) => {
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
    >
      <IconWrapper width={14} height={14} color="#A1ACB3">
        <VisibilityIcon />
      </IconWrapper>
      <DropDownWrapper>
        {props.columns.map((option: ReactTableColumnProps, index: number) => (
          <OptionWrapper
            selected={false}
            key={index}
            onClick={() => {
              console.log("test");
            }}
            className={Classes.POPOVER_DISMISS}
          >
            {option.Header}
          </OptionWrapper>
        ))}
      </DropDownWrapper>
    </Popover>
  );
};

export default TableColumnsVisibility;
