import React, { useEffect } from "react";
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
// import TableColumnsVisibility from "components/designSystems/appsmith/TableColumnsVisibility";
import TableFilters, {
  ReactTableFilter,
} from "components/designSystems/appsmith/TableComponent/TableFilters";
import {
  ReactTableColumnProps,
  CompactMode,
  TableSizes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import TableDataDownload from "components/designSystems/appsmith/TableComponent/TableDataDownload";
import TableCompactMode from "components/designSystems/appsmith/TableComponent/TableCompactMode";
import { Colors } from "constants/Colors";
import { EventType } from "constants/ActionConstants";
import ScrollIndicator from "components/ads/ScrollIndicator";

const PageNumberInputWrapper = styled(NumericInput)`
  &&& input {
    box-shadow: none;
    background: linear-gradient(0deg, ${Colors.WHITE}, ${Colors.WHITE}),
      ${Colors.POLAR};
    border: 1px solid ${Colors.GREEN};
    box-sizing: border-box;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    padding: 0 !important;
    text-align: center;
    font-size: 12px;
  }
  margin: 0 8px;
`;

const PageNumberInput = (props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
}) => {
  const [pageNumber, setPageNumber] = React.useState(props.pageNo || 0);
  useEffect(() => {
    setPageNumber(props.pageNo || 0);
  }, [props.pageNo]);
  return (
    <PageNumberInputWrapper
      value={pageNumber}
      min={1}
      max={props.pageCount || 1}
      buttonPosition="none"
      clampValueOnBlur
      onBlur={(e: any) => {
        const oldPageNo = Number(props.pageNo || 0);
        const value = e.target.value;
        let page = Number(value);
        if (isNaN(value) || Number(value) < 1) {
          page = 1;
        }
        if (oldPageNo < page) {
          props.updatePageNo(page, EventType.ON_NEXT_PAGE);
        } else if (oldPageNo > page) {
          props.updatePageNo(page, EventType.ON_PREV_PAGE);
        }
      }}
      onValueChange={(value: number) => {
        if (isNaN(value) || value < 1) {
          setPageNumber(1);
        } else if (value > props.pageCount) {
          setPageNumber(props.pageCount);
        } else {
          setPageNumber(value);
        }
      }}
    />
  );
};

interface TableHeaderProps {
  updatePageNo: (pageNo: number, event?: EventType) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  tableData: Array<Record<string, unknown>>;
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
  editMode: boolean;
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
  width: number;
  tableSizes: TableSizes;
}

const TableHeader = (props: TableHeaderProps) => {
  const tableHeaderWrapperRef = React.createRef<HTMLDivElement>();

  return (
    <TableHeaderWrapper
      serverSidePaginationEnabled={props.serverSidePaginationEnabled}
      width={props.width}
      tableSizes={props.tableSizes}
      backgroundColor={Colors.WHITE}
      ref={tableHeaderWrapperRef}
    >
      <SearchComponent
        value={props.searchKey}
        placeholder="Search..."
        onSearch={props.searchTableData}
      />
      <CommonFunctionsMenuWrapper tableSizes={props.tableSizes}>
        <TableFilters
          columns={props.columns}
          filters={props.filters}
          applyFilter={props.applyFilter}
          editMode={props.editMode}
        />
        <TableDataDownload
          data={props.tableData}
          columns={props.tableColumns}
          widgetName={props.widgetName}
        />
        {/* {props.editMode && (
          <TableColumnsVisibility
            columns={props.columns}
            hiddenColumns={props.hiddenColumns}
            updateHiddenColumns={props.updateHiddenColumns}
          />
        )} */}
        <TableCompactMode
          compactMode={props.compactMode}
          updateCompactMode={props.updateCompactMode}
        />
      </CommonFunctionsMenuWrapper>
      {props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            className="t--table-widget-prev-page"
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
            className="t--table-widget-next-page"
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
          <RowWrapper className="show-page-items">
            {props.tableData?.length} Records
          </RowWrapper>
          <PaginationItemWrapper
            className="t--table-widget-prev-page"
            disabled={props.currentPageIndex === 0}
            onClick={() => {
              const pageNo =
                props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
              props.updatePageNo(pageNo + 1, EventType.ON_PREV_PAGE);
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
            className="t--table-widget-next-page"
            disabled={props.currentPageIndex === props.pageCount - 1}
            onClick={() => {
              const pageNo =
                props.currentPageIndex < props.pageCount - 1
                  ? props.currentPageIndex + 1
                  : 0;
              props.updatePageNo(pageNo + 1, EventType.ON_NEXT_PAGE);
            }}
          >
            <Icon icon="chevron-right" iconSize={16} color={Colors.HIT_GRAY} />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
      <ScrollIndicator containerRef={tableHeaderWrapperRef} mode="LIGHT" />
    </TableHeaderWrapper>
  );
};

export default TableHeader;
