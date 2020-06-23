import React from "react";
import {
  PaginationWrapper,
  TableHeaderWrapper,
  PaginationItemWrapper,
} from "./TableStyledWrappers";
import { Icon } from "@blueprintjs/core";

interface TableHeaderProps {
  updatePageNo: Function;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  pageCount: number;
  currentPageIndex: number;
  pageOptions: number[];
  serverSidePaginationEnabled: boolean;
}

const TableHeader = (props: TableHeaderProps) => {
  return (
    <TableHeaderWrapper>
      {props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            disabled={false}
            onClick={() => {
              props.prevPageClick();
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color="#A1ACB3" />
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
            <Icon icon="chevron-right" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
      {!props.serverSidePaginationEnabled && (
        <PaginationWrapper>
          <PaginationItemWrapper
            disabled={props.currentPageIndex === 0}
            onClick={() => {
              const pageNo =
                props.currentPageIndex > 0 ? props.currentPageIndex - 1 : 0;
              props.updatePageNo(pageNo + 1);
            }}
          >
            <Icon icon="chevron-left" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
          {props.pageOptions.map((pageNumber: number, index: number) => {
            return (
              <PaginationItemWrapper
                key={index}
                selected={pageNumber === props.currentPageIndex}
                onClick={() => {
                  props.updatePageNo(pageNumber + 1);
                }}
                className="page-item"
              >
                {index + 1}
              </PaginationItemWrapper>
            );
          })}
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
            <Icon icon="chevron-right" iconSize={16} color="#A1ACB3" />
          </PaginationItemWrapper>
        </PaginationWrapper>
      )}
    </TableHeaderWrapper>
  );
};

export default TableHeader;
