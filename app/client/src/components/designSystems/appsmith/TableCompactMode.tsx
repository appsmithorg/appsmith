import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as CompactIcon } from "assets/icons/control/compact.svg";
import { CompactMode, CompactModeTypes } from "widgets/TableWidget";
import TableActionIcon from "components/designSystems/appsmith/TableActionIcon";

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
  padding: 8px;
`;

const OptionWrapper = styled.div<{ selected?: boolean }>`
  display: flex;
  width: calc(100% - 20px);
  justify-content: space-between;
  align-items: center;
  height: 32px;
  box-sizing: border-box;
  padding: 8px;
  color: ${Colors.OXFORD_BLUE};
  opacity: ${props => (props.selected ? 1 : 0.7)};
  min-width: 200px;
  cursor: pointer;
  margin-bottom: 4px;
  background: ${props => (props.selected ? Colors.POLAR : Colors.WHITE)};
  border-left: ${props => (props.selected ? "4px solid #29CCA3" : "none")};
  border-radius: 4px;
  .option-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
  }
  &:hover {
    background: ${Colors.POLAR};
  }
`;

type CompactModeItem = {
  title: string;
  value: CompactMode;
};

const CompactModes: CompactModeItem[] = [
  {
    title: "Short",
    value: CompactModeTypes.SHORT,
  },
  {
    title: "Default",
    value: CompactModeTypes.DEFAULT,
  },
  {
    title: "Tall",
    value: CompactModeTypes.TALL,
  },
];

interface TableCompactModeProps {
  compactMode?: CompactMode;
  updateCompactMode: (mode: CompactMode) => void;
}

const TableCompactMode = (props: TableCompactModeProps) => {
  const [selected, selectMenu] = React.useState(false);
  return (
    <Popover
      minimal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      onClose={() => {
        selectMenu(false);
      }}
      isOpen={selected}
    >
      <TableActionIcon
        tooltip="Row Height"
        selected={selected}
        selectMenu={(selected: boolean) => {
          selectMenu(selected);
        }}
        className="t--table-compact-mode-toggle-btn"
      >
        <CompactIcon />
      </TableActionIcon>
      <DropDownWrapper>
        {CompactModes.map((item: CompactModeItem, index: number) => {
          return (
            <OptionWrapper
              selected={
                props.compactMode ? props.compactMode === item.value : false
              }
              key={index}
              onClick={() => {
                props.updateCompactMode(item.value);
              }}
              className={`${Classes.POPOVER_DISMISS} t--table-compact-mode-option`}
            >
              {item.title}
            </OptionWrapper>
          );
        })}
      </DropDownWrapper>
    </Popover>
  );
};

export default TableCompactMode;
