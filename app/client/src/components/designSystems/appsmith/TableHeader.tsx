import React from "react";
import styled from "styled-components";
import { Icon, NumericInput } from "@blueprintjs/core";
import {
  RowWrapper,
  PaginationWrapper,
  TableHeaderWrapper,
  PaginationItemWrapper,
  CommonFunctionsMenuWrapper,
} from "./TableStyledWrappers";
import SearchComponent from "components/designSystems/appsmith/SearchComponent";
import TableColumnsVisibility from "components/designSystems/appsmith/TableColumnsVisibility";
import TableFilters, {
  ReactTableFilter,
} from "components/designSystems/appsmith/TableFilters";

import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import TableDataDownload from "components/designSystems/appsmith/TableDataDownload";
import { Colors } from "constants/Colors";

const PageNumberInputWrapper = styled(NumericInput)`
  &&& input {
    box-shadow: none;
    background: linear-gradient(0deg, ${Colors.WHITE}, ${Colors.WHITE}),
      ${Colors.POLAR};
    border: 1px solid ${Colors.GREEN};
    box-sizing: border-box;
    border-radius: 4px;
    width: 32px;
    padding: 0 !important;
    text-align: center;
  }
  margin: 0 8px;
`;

const PageNumberInput = (props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: Function;
}) => {
  return (
    <PageNumberInputWrapper
      value={props.pageNo || 0}
      min={1}
      max={props.pageCount || 1}
      buttonPosition="none"
      clampValueOnBlur={true}
      onValueChange={(value: number) => {
        if (isNaN(value) || value < 1) {
          props.updatePageNo(1);
        } else if (value > props.pageCount) {
          props.updatePageNo(props.pageCount);
        } else {
          props.updatePageNo(value);
        }
      }}
    />
  );
};

interface TableHeaderProps {
  updatePageNo: Function;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  tableData: object[];
  tableColumns: ReactTableColumnProps[];
  pageCount: number;
  currentPageIndex: number;
  pageOptions: number[];
  columns: ReactTableColumnProps[];
  hiddenColumns?: string[];
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  widgetName: string;
  searchKey: string;
  searchTableData: (searchKey: any) => void;
  serverSidePaginationEnabled: boolean;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  displayColumnActions: boolean;
}

const TableHeader = (props: TableHeaderProps) => {
  return (
    <TableHeaderWrapper>
      <SearchComponent
        value={props.searchKey}
        placeholder="Search..."
        onSearch={props.searchTableData}
      />
      <CommonFunctionsMenuWrapper>
        <TableFilters
          columns={props.columns}
          filters={props.filters}
          applyFilter={props.applyFilter}
        />
        <TableDataDownload
          data={props.tableData}
          columns={props.tableColumns}
          widgetName={props.widgetName}
        />
        {props.displayColumnActions && (
          <TableColumnsVisibility
            columns={props.columns}
            hiddenColumns={props.hiddenColumns}
            updateHiddenColumns={props.updateHiddenColumns}
          />
        )}
      </CommonFunctionsMenuWrapper>
      {props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            disabled={false}
            onClick={() => {
              props.prevPageClick();
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color={Colors.HIT_GRAY} />
          </PaginationItemWrapper>
          <PaginationItemWrapper selected className="page-item">
            {props.pageNo + 1}
          </PaginationItemWrapper>
          <PaginationItemWrapper
            disabled={false}
            onClick={() => {
              props.nextPageClick();
            }}
          >
            <Icon icon="chevron-right" iconSize={16} color={Colors.HIT_GRAY} />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
      {!props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <RowWrapper>
            Showing {props.currentPageIndex + 1}-{props.pageCount} items
          </RowWrapper>
          <PaginationItemWrapper
            disabled={props.currentPageIndex === 0}
            onClick={() => {
              const pageNo =
                props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
              props.updatePageNo(pageNo + 1);
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color={Colors.HIT_GRAY} />
          </PaginationItemWrapper>
          <RowWrapper>
            Page{" "}
            <PageNumberInput
              pageNo={props.pageNo + 1}
              updatePageNo={props.updatePageNo}
              pageCount={props.pageCount}
            />{" "}
            of {props.pageCount}
          </RowWrapper>
          <PaginationItemWrapper
            disabled={props.currentPageIndex === props.pageCount - 1}
            onClick={() => {
              const pageNo =
                props.currentPageIndex < props.pageCount - 1
                  ? props.currentPageIndex + 1
                  : 0;
              props.updatePageNo(pageNo + 1);
            }}
          >
            <Icon icon="chevron-right" iconSize={16} color={Colors.HIT_GRAY} />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
    </TableHeaderWrapper>
  );
};

export default TableHeader;
