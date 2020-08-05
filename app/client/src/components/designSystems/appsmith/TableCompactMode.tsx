import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
  Icon,
  Tooltip,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as CompactIcon } from "assets/icons/control/compact.svg";
import { TableIconWrapper } from "components/designSystems/appsmith/TableStyledWrappers";

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

interface TableCompactModeProps {
  compactMode?: string;
  updateCompactMode: (mode: string) => void;
}

type CompactMode = {
  title: string;
  value: string;
};

const CompactModes: CompactMode[] = [
  {
    title: "Short",
    value: "short",
  },
  {
    title: "Default",
    value: "default",
  },
];

const TableCompactMode = (props: TableCompactModeProps) => {
  const [selected, selectMenu] = React.useState(false);
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      onClose={() => {
        selectMenu(false);
      }}
    >
      <TableIconWrapper
        selected={selected}
        onClick={e => {
          selectMenu(!selected);
        }}
      >
        <Tooltip
          autoFocus={false}
          hoverOpenDelay={1000}
          content="Hidden Fields"
          position="top"
        >
          <IconWrapper
            width={20}
            height={20}
            color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
          >
            <CompactIcon />
          </IconWrapper>
        </Tooltip>
      </TableIconWrapper>
      <DropDownWrapper>
        {CompactModes.map((item: CompactMode, index: number) => {
          return (
            <OptionWrapper
              selected={
                props.compactMode ? props.compactMode === item.value : false
              }
              key={index}
              onClick={() => {
                props.updateCompactMode(item.value);
              }}
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
