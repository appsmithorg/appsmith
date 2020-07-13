import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
  Icon,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as VisibleIcon } from "assets/icons/control/columns-visibility.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import Button from "components/editorComponents/Button";

const TableIconWrapper = styled.div<{ selected?: boolean; disabled?: boolean }>`
  background: ${props => (props.selected ? Colors.ATHENS_GRAY : "transparent")};
  box-shadow: ${props =>
    props.selected ? `inset 0px 4px 0px ${Colors.GREEN}` : "none"};
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => (props.disabled ? 0.6 : 1)};
  cursor: ${props => !props.disabled && "pointer"};
`;

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
`;

const OptionWrapper = styled.div<{ selected: boolean }>`
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
  margin: 10px 10px 0 10px;
  background: ${Colors.WHITE};
  .option-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items; center;
  height: 40px;
  box-sizing: border-box;
  min-width: 224px;
  padding: 5px 15px;
  background: ${Colors.WHITE};
  box-shadow: 0px -1px 2px rgba(67, 70, 74, 0.12);
  margin-top: 10px;
`;

interface TableColumnsVisibilityProps {
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
}

const VisibilityIcon = (props: { visible?: boolean }) => {
  return props.visible ? (
    <Icon icon="eye-open" iconSize={20} color={Colors.OXFORD_BLUE} />
  ) : (
    <VisibleIcon />
  );
};

const TableColumnsVisibility = (props: TableColumnsVisibilityProps) => {
  const [selected, selectMenu] = React.useState(false);
  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper width={20} height={20} color={Colors.CADET_BLUE}>
          <VisibilityIcon />
        </IconWrapper>
      </TableIconWrapper>
    );
  }
  const columns = props.columns.sort(
    (a: ReactTableColumnProps, b: ReactTableColumnProps) => {
      return a.accessor > b.accessor ? 1 : b.accessor > a.accessor ? -1 : 0;
    },
  );
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
          selectMenu(true);
        }}
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          <VisibilityIcon />
        </IconWrapper>
      </TableIconWrapper>
      <DropDownWrapper>
        {columns.map((option: ReactTableColumnProps, index: number) => (
          <OptionWrapper
            selected={!option.isHidden}
            key={index}
            onClick={() => {
              const hiddenColumns = props.hiddenColumns || [];
              if (!option.isHidden) {
                hiddenColumns.push(option.accessor);
              } else {
                hiddenColumns.splice(hiddenColumns.indexOf(option.accessor), 1);
              }
              props.updateHiddenColumns(hiddenColumns);
            }}
          >
            <div className="option-title">{option.Header}</div>
            <VisibilityIcon visible={!option.isHidden} />
          </OptionWrapper>
        ))}
        <ButtonWrapper className={Classes.POPOVER_DISMISS}>
          <Button
            intent="primary"
            text="Show All"
            filled
            size="small"
            onClick={() => {
              props.updateHiddenColumns([]);
            }}
          />
        </ButtonWrapper>
      </DropDownWrapper>
    </Popover>
  );
};

export default TableColumnsVisibility;
