import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverInteractionKind,
  Position,
  Icon,
  Classes,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import { TableIconWrapper } from "components/designSystems/appsmith/TableStyledWrappers";
import Button from "components/editorComponents/Button";
import CascadeFields, {
  Operator,
  operators,
} from "components/designSystems/appsmith/CascadeFields";
import { isString, isNumber } from "lodash";
import moment from "moment";

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

const DropdownTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  &&& div {
    color: ${Colors.OXFORD_BLUE};
  }
  &&& span {
    margin-right: 0;
  }
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
}

const TableFilters = (props: TableFilterProps) => {
  const [selected, selectMenu] = React.useState(false);
  const [filters, updateFilters] = React.useState(
    new Array<ReactTableFilter>(),
  );

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters || [];
    if (filters.length === 0) {
      filters.push({
        column: "",
        operator: "or",
        value: "",
        condition: "",
      });
    }
    updateFilters(filters);
  }, [props.filters]);

  const addFilter = () => {
    const updatedFilters = [...props.filters];
    let operator = operators.or;
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
      </TableIconWrapper>
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
                const updatedFilters = props.filters || [];
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
        <ButtonWrapper className={Classes.POPOVER_DISMISS}>
          <Button
            intent="primary"
            text="Add Filter"
            size="small"
            onClick={addFilter}
            icon="plus"
          />
        </ButtonWrapper>
      </TableFilerWrapper>
    </Popover>
  );
};

const ConditionFunctions: { [key: string]: (a: any, b: any) => boolean } = {
  isExactly: (a: any, b: any) => {
    return a == b;
  },
  empty: (a: any) => {
    return a == "" || a == undefined || a == null;
  },
  notEmpty: (a: any) => {
    return a != "" && a != undefined && a != null;
  },
  notEqualTo: (a: any, b: any) => {
    return a != b;
  },
  lessThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA < numericB;
  },
  lessThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA <= numericB;
  },
  greaterThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA > numericB;
  },
  greaterThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA >= numericB;
  },
  contains: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.includes(b);
    }
    return false;
  },
  doesNotContain: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return !a.includes(b);
    }
    return false;
  },
  startsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.indexOf(b) === 0;
    }
    return false;
  },
  endsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.length === a.indexOf(b) + b.length;
    }
    return false;
  },
  is: (a: any, b: any) => {
    return moment(a).isSame(moment(b), "d");
  },
  isNot: (a: any, b: any) => {
    return !moment(a).isSame(moment(b), "d");
  },
  isAfter: (a: any, b: any) => {
    return !moment(a).isAfter(moment(b), "d");
  },
  isBefore: (a: any, b: any) => {
    return !moment(a).isBefore(moment(b), "d");
  },
};

export type Condition = keyof typeof ConditionFunctions | "";

export function compare(a: any, b: any, condition: Condition) {
  let result = true;
  try {
    const conditionFunction = ConditionFunctions[condition];
    if (conditionFunction) {
      result = conditionFunction(a, b);
    }
  } catch (e) {
    console.error(e);
  }
  return result;
}

export default TableFilters;
