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
import Button from "components/editorComponents/Button";
import { ReactTableColumnProps } from "./Constants";
import { TableIconWrapper } from "./TableStyledWrappers";
import TableActionIcon from "./TableActionIcon";

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
  max-height: 500px;
  max-width: 400px;
  overflow: hidden scroll;
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
  opacity: ${(props) => (props.selected ? 1 : 0.7)};
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

const StyledOption = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90%;
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

function VisibilityIcon(props: { visible?: boolean }) {
  return props.visible ? (
    <Icon
      className="visible-icon"
      color={Colors.OXFORD_BLUE}
      icon="eye-open"
      iconSize={20}
    />
  ) : (
    <VisibleIcon className="hidden-icon" />
  );
}

function TableColumnsVisibility(props: TableColumnsVisibilityProps) {
  const [selected, selectMenu] = React.useState(false);
  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper color={Colors.CADET_BLUE} height={20} width={20}>
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
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      isOpen={selected}
      minimal
      onClose={() => {
        selectMenu(false);
      }}
      position={Position.BOTTOM}
      usePortal
    >
      <TableActionIcon
        className="t--table-column-visibility-toggle-btn"
        selectMenu={(selected: boolean) => {
          selectMenu(selected);
        }}
        selected={selected}
        tooltip="Hidden Fields"
      >
        <VisibilityIcon />
      </TableActionIcon>
      <DropDownWrapper>
        {columns.map((option: ReactTableColumnProps, index: number) => (
          <OptionWrapper
            className="t--table-column-visibility-column-toggle"
            key={index}
            onClick={() => {
              const hiddenColumns = Array.isArray(props.hiddenColumns)
                ? props.hiddenColumns.slice()
                : [];
              if (!option.isHidden) {
                hiddenColumns.push(option.accessor);
              } else {
                hiddenColumns.splice(hiddenColumns.indexOf(option.accessor), 1);
              }
              props.updateHiddenColumns(hiddenColumns);
            }}
            selected={!option.isHidden}
          >
            <StyledOption className="option-title">
              {option.Header}
            </StyledOption>
            <VisibilityIcon visible={!option.isHidden} />
          </OptionWrapper>
        ))}
        <ButtonWrapper className={Classes.POPOVER_DISMISS}>
          <Button
            className="t--table-column-show-all-btn"
            filled
            intent="primary"
            onClick={() => {
              props.updateHiddenColumns([]);
            }}
            size="small"
            text="Show All"
          />
        </ButtonWrapper>
      </DropDownWrapper>
    </Popover>
  );
}

export default TableColumnsVisibility;
