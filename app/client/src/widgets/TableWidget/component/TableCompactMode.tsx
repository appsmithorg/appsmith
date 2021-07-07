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
import { CompactMode, CompactModeTypes } from "./Constants";
import TableActionIcon from "./TableActionIcon";

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
  opacity: ${(props) => (props.selected ? 1 : 0.7)};
  min-width: 200px;
  cursor: pointer;
  margin-bottom: 4px;
  background: ${(props) => (props.selected ? Colors.POLAR : Colors.WHITE)};
  border-left: ${(props) =>
    props.selected ? "4px solid rgb(3, 179, 101)" : "none"};
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

function TableCompactMode(props: TableCompactModeProps) {
  const [selected, selectMenu] = React.useState(false);
  return (
    <Popover
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      isOpen={selected}
      minimal
      onClose={() => {
        selectMenu(false);
      }}
      position={Position.BOTTOM}
    >
      <TableActionIcon
        className="t--table-compact-mode-toggle-btn"
        selectMenu={(selected: boolean) => {
          selectMenu(selected);
        }}
        selected={selected}
        tooltip="Row Height"
      >
        <CompactIcon />
      </TableActionIcon>
      <DropDownWrapper>
        {CompactModes.map((item: CompactModeItem, index: number) => {
          return (
            <OptionWrapper
              className={`${Classes.POPOVER_DISMISS} t--table-compact-mode-option`}
              key={index}
              onClick={() => {
                props.updateCompactMode(item.value);
              }}
              selected={
                props.compactMode ? props.compactMode === item.value : false
              }
            >
              {item.title}
            </OptionWrapper>
          );
        })}
      </DropDownWrapper>
    </Popover>
  );
}

export default TableCompactMode;
