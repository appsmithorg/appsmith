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
import CascadeFields from "components/designSystems/appsmith/CascadeFields";

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
    color: #2e3d49;
  }
  &&& span {
    margin-right: 0;
  }
`;

export interface ReactTableFilter {
  column: string;
  operator: string;
  value: any;
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
        operator: "",
        value: "",
      });
    }
    updateFilters(filters);
  }, []);

  const addFilter = () => {
    filters.push({
      column: "",
      operator: "",
      value: "",
    });
    updateFilters(filters);
    props.applyFilter(filters);
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
        {props.filters &&
          props.filters.map((filter: ReactTableFilter, index: number) => {
            return (
              <CascadeFields
                key={index}
                index={index}
                filter={filter}
                columns={props.columns}
                applyFilter={(filter: ReactTableFilter, index: number) => {
                  const filters = props.filters || [];
                  filters[index] = filter;
                  props.applyFilter(filters);
                }}
                removeFilter={(index: number) => {
                  const filters: ReactTableFilter[] = [...props.filters];
                  filters.splice(index, 1);
                  props.applyFilter(filters);
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

export default TableFilters;

// Use react memoize
// const filterOptions = [
//   {
//     content: "Created Date",
//     id: "created_date",
//     type: "date",
//     next: {
//       type: "dropdown",
//       placeholder: "is",
//       options: [
//         {
//           content: "is",
//           id: "is",
//           next: {
//             type: "date",
//             placeholder: "Enter date",
//           },
//         },
//         {
//           content: "is before",
//           id: "is_before",
//           next: {
//             type: "date",
//             placeholder: "Enter date",
//           },
//         },
//         {
//           content: "is after",
//           id: "is_after",
//           next: {
//             type: "date",
//             placeholder: "Enter date",
//           },
//         },
//       ],
//     },
//   },
//   {
//     content: "User Name",
//     id: "user_name",
//     type: "text",
//     next: {
//       type: "dropdown",
//       placeholder: "is",
//       options: [
//         {
//           content: "contains",
//           id: "contains",
//         },
//         {
//           content: "does not contains",
//           id: "does_not_contain",
//         },
//         {
//           content: "starts with",
//           id: "starts_with",
//         },
//       ],
//     },
//   },
// ];
