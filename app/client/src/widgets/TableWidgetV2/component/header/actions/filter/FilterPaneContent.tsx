import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import {
  ReactTableColumnProps,
  ReactTableFilter,
  Operator,
  OperatorTypes,
} from "../../../Constants";
import { DropdownOption } from ".";
import CascadeFields from "./CascadeFields";
import {
  createMessage,
  TABLE_FILTER_COLUMN_TYPE_CALLOUT,
} from "@appsmith/constants/messages";
import { Icon, IconSize } from "design-system";
import Button from "pages/AppViewer/AppViewerButton";
import { ButtonVariantTypes } from "components/constants";

import AddIcon from "remixicon-react/AddLineIcon";
import { cloneDeep } from "lodash";

const TableFilterOuterWrapper = styled.div<{
  borderRadius?: string;
}>`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: ${Colors.WHITE};
  box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15);
  border-radius: ${(props) => props.borderRadius || "0"};
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
  justify-content: space-between;
  align-items: center;
  background: ${Colors.WHITE};
  margin-top: 14px;
  &&& button:hover {
    background: transparent;
  }
  .${Classes.BUTTON_TEXT} {
    font-weight: 600 !important;
  }
`;

const ButtonActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  &&& button {
    margin-left: 14px;
  }
`;

// margin-left is same as move block width in TableFilterPane.tsx
const ColumnTypeBindingMessage = styled.div`
  height: 40px;
  line-height: 40px;
  background: var(--wds-color-bg-light);
  box-sizing: border-box;
  font-size: 12px;
  color: var(--wds-color-text-light);
  letter-spacing: 0.04em;
  font-weight: 500;
  margin-left: 83px;
  min-width: 350px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .message-text {
    padding: 0 8px 0 16px;
  }

  & .close-button {
    cursor: pointer;
    margin: 3px;
    height: 34px;
    width: 34px;
    display: flex;
    justify-content: center;
    &:hover {
      background-color: ${Colors.GREY_3};
      svg path {
        fill: ${Colors.GREY_10};
      }
    }
  }
`;

interface TableFilterProps {
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  hideFilterPane: (widgetId: string) => void;
  widgetId: string;
  accentColor: string;
  borderRadius: string;
}

const DEFAULT_FILTER = {
  column: "",
  operator: OperatorTypes.OR,
  value: "",
  condition: "",
};

function TableFilterPaneContent(props: TableFilterProps) {
  const [filters, updateFilters] = React.useState(
    new Array<ReactTableFilter>(),
  );

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters ? [...props.filters] : [];
    if (filters.length === 0) {
      filters.push({ ...DEFAULT_FILTER });
    }
    updateFilters(filters);
  }, [props.filters]);

  const addFilter = () => {
    const updatedFilters = filters ? [...filters] : [];
    let operator: Operator = OperatorTypes.OR;
    if (updatedFilters.length >= 2) {
      operator = updatedFilters[1].operator;
    }
    updatedFilters.push({ ...DEFAULT_FILTER, operator });
    updateFilters(updatedFilters);
  };

  const applyFilter = () => {
    props.applyFilter(filters);
  };

  const hideFilter = () => {
    props.hideFilterPane(props.widgetId);
  };

  const clearFilters = useCallback(() => {
    props.applyFilter([{ ...DEFAULT_FILTER }]);
  }, []);

  const columns: DropdownOption[] = props.columns
    .map((column: ReactTableColumnProps) => {
      const type = column.metaProperties?.type || "text";
      return {
        label: column.Header,
        value: column.alias,
        type: type,
      };
    })
    .filter((column: { label: string; value: string; type: string }) => {
      return !["video", "button", "image", "iconButton", "menuButton"].includes(
        column.type as string,
      );
    });
  const hasAnyFilters = !!(
    filters.length >= 1 &&
    filters[0].column &&
    filters[0].condition
  );
  return (
    <TableFilterOuterWrapper
      borderRadius={props.borderRadius}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <ColumnTypeBindingMessage>
        <div className="message-text">
          {createMessage(TABLE_FILTER_COLUMN_TYPE_CALLOUT)}
        </div>
        <div className="close-button t--close-filter-btn" onClick={hideFilter}>
          <Icon fillColor={Colors.GREY_6} name="close-x" size={IconSize.XXL} />
        </div>
      </ColumnTypeBindingMessage>
      <TableFilerWrapper onClick={(e) => e.stopPropagation()}>
        {filters.map((filter: ReactTableFilter, index: number) => {
          return (
            <CascadeFields
              accentColor={props.accentColor}
              applyFilter={(
                filter: ReactTableFilter,
                index: number,
                isOperatorChange: boolean,
              ) => {
                // here updated filters store in state, not in redux
                const updatedFilters = filters ? cloneDeep(filters) : [];
                updatedFilters[index] = filter;
                if (isOperatorChange) {
                  /*
                    This if-block updates the operator for all filters after
                    second filter if the second filter operator is changed
                  */
                  let index = 2;
                  while (index < updatedFilters.length) {
                    updatedFilters[index].operator = updatedFilters[1].operator;
                    index++;
                  }
                }
                updateFilters(updatedFilters);
              }}
              borderRadius={props.borderRadius}
              column={filter.column}
              columns={columns}
              condition={filter.condition}
              hasAnyFilters={hasAnyFilters}
              index={index}
              key={index + JSON.stringify(filter)}
              operator={
                filters.length >= 2 ? filters[1].operator : filter.operator
              }
              removeFilter={(index: number) => {
                const updatedFilters = cloneDeep(filters);
                let newFilters: Array<ReactTableFilter> = [];
                if (updatedFilters) {
                  if (index === 1 && updatedFilters.length > 2) {
                    updatedFilters[2].operator = updatedFilters[1].operator;
                  }
                  newFilters = [
                    ...updatedFilters.slice(0, index),
                    ...updatedFilters.slice(index + 1),
                  ];
                }
                if (newFilters.length === 0) {
                  newFilters.push({ ...DEFAULT_FILTER });
                }
                // removed filter directly update redux
                // with redux update, useEffect will update local state too
                props.applyFilter(newFilters);
              }}
              value={filter.value}
            />
          );
        })}
        {hasAnyFilters ? (
          <ButtonWrapper>
            <Button
              borderRadius={props.borderRadius}
              buttonColor={props.accentColor}
              buttonVariant={ButtonVariantTypes.TERTIARY}
              className="t--add-filter-btn"
              icon={<AddIcon className="w-5 h-5" color={props.accentColor} />}
              onClick={addFilter}
              size="small"
              text="Add Filter"
            />
            <ButtonActionsWrapper>
              <Button
                borderRadius={props.borderRadius}
                buttonColor={props.accentColor}
                buttonVariant={ButtonVariantTypes.SECONDARY}
                className="t--clear-all-filter-btn"
                onClick={clearFilters}
                text="CLEAR ALL"
              />
              <Button
                borderRadius={props.borderRadius}
                buttonColor={props.accentColor}
                buttonVariant={ButtonVariantTypes.PRIMARY}
                className="t--apply-filter-btn"
                onClick={applyFilter}
                text="APPLY"
              />
            </ButtonActionsWrapper>
          </ButtonWrapper>
        ) : null}
      </TableFilerWrapper>
    </TableFilterOuterWrapper>
  );
}

export default TableFilterPaneContent;
