import React, { useEffect } from "react";
import {
  Popover,
  PopoverInteractionKind,
  Position,
  Classes,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import { TableIconWrapper } from "components/designSystems/appsmith/TableStyledWrappers";
import Button from "components/editorComponents/Button";
import CascadeFields from "components/designSystems/appsmith/CascadeFields";
import {
  ReactTableColumnProps,
  Condition,
  Operator,
  OperatorTypes,
} from "widgets/TableWidget";
import { TABLE_FILTER_COLUMN_TYPE_CALLOUT } from "constants/messages";

const TableFilterOuterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TableFilerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2px 16px 14px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items; center;
  background: ${Colors.WHITE};
  margin-top: 14px;
  &&& button:hover {
    background: transparent;
  }
`;

const SelectedFilterWrapper = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${Colors.GREEN};
  border: 0.5px solid ${Colors.WHITE};
  box-sizing: border-box;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 6px;
  color: ${Colors.WHITE};
`;

const ColumnTypeBindingMessage = styled.div`
  width: 100%;
  height: 41px;
  line-height: 41px;
  background: ${Colors.ATHENS_GRAY_DARKER};
  border: 1px dashed ${Colors.GEYSER_LIGHT};
  box-sizing: border-box;
  font-size: 12px;
  color: ${Colors.SLATE_GRAY};
  letter-spacing: 0.04em;
  font-weight: 500;
  padding: 0 16px;
  min-width: 350px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
`;
export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  value: any;
}

export interface DropdownOption {
  label: string;
  value: string;
  type: string;
}
interface TableFilterProps {
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  editMode: boolean;
}

const TableFilters = (props: TableFilterProps) => {
  const [selected, selectMenu] = React.useState(false);
  const [filters, updateFilters] = React.useState(
    new Array<ReactTableFilter>(),
  );

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters ? [...props.filters] : [];
    if (filters.length === 0) {
      filters.push({
        column: "",
        operator: OperatorTypes.OR,
        value: "",
        condition: "",
      });
    }
    updateFilters(filters);
  }, [props.filters]);

  const addFilter = () => {
    const updatedFilters = [...props.filters];
    let operator: Operator = OperatorTypes.OR;
    if (updatedFilters.length >= 2) {
      operator = updatedFilters[1].operator;
    }
    updatedFilters.push({
      column: "",
      operator: operator,
      value: "",
      condition: "",
    });
    props.applyFilter(updatedFilters);
  };
  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper width={20} height={20} color={Colors.CADET_BLUE}>
          <FilterIcon />
        </IconWrapper>
      </TableIconWrapper>
    );
  }
  const columns: DropdownOption[] = props.columns.map(
    (column: ReactTableColumnProps) => {
      const type = column.metaProperties?.type || "text";
      return {
        label: column.Header,
        value: column.accessor,
        type: type,
      };
    },
  );
  const showAddFilter =
    filters.length >= 1 && filters[0].column && filters[0].condition;
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
      isOpen={selected}
    >
      <TableIconWrapper
        selected={selected}
        onClick={e => {
          selectMenu(true);
          e.stopPropagation();
        }}
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          <FilterIcon />
        </IconWrapper>
        {showAddFilter ? (
          <SelectedFilterWrapper>{filters.length}</SelectedFilterWrapper>
        ) : null}
      </TableIconWrapper>
      <TableFilterOuterWrapper>
        <TableFilerWrapper onClick={e => e.stopPropagation()}>
          {filters.map((filter: ReactTableFilter, index: number) => {
            return (
              <CascadeFields
                key={index}
                index={index}
                operator={
                  filters.length >= 2 ? filters[1].operator : filter.operator
                }
                column={filter.column}
                condition={filter.condition}
                value={filter.value}
                columns={columns}
                applyFilter={(filter: ReactTableFilter, index: number) => {
                  const updatedFilters = props.filters
                    ? [...props.filters]
                    : [];
                  updatedFilters[index] = filter;
                  props.applyFilter(updatedFilters);
                }}
                removeFilter={(index: number) => {
                  const filters: ReactTableFilter[] = props.filters || [];
                  if (index === 1 && filters.length > 2) {
                    filters[2].operator = filters[1].operator;
                  }
                  const newFilters = [
                    ...filters.slice(0, index),
                    ...filters.slice(index + 1),
                  ];
                  props.applyFilter(newFilters);
                }}
              />
            );
          })}
          {showAddFilter ? (
            <ButtonWrapper className={Classes.POPOVER_DISMISS}>
              <Button
                intent="primary"
                text="Add Filter"
                size="small"
                onClick={addFilter}
                icon="plus"
              />
            </ButtonWrapper>
          ) : null}
        </TableFilerWrapper>
        {props.editMode && (
          <ColumnTypeBindingMessage>
            {TABLE_FILTER_COLUMN_TYPE_CALLOUT}
          </ColumnTypeBindingMessage>
        )}
      </TableFilterOuterWrapper>
    </Popover>
  );
};

export default TableFilters;
