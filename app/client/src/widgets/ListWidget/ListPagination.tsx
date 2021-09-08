import React from "react";
import Pagination from "rc-pagination";
import styled, { css } from "styled-components";

const locale = {
  // Options.jsx
  items_per_page: "/ page",
  jump_to: "Go to",
  jump_to_confirm: "confirm",
  page: "",
  // Pagination.jsx
  prev_page: "Previous Page",
  next_page: "Next Page",
  prev_5: "Previous 5 Pages",
  next_5: "Next 5 Pages",
  prev_3: "Previous 3 Pages",
  next_3: "Next 3 Pages",
};

const paginatorCss = css`
  margin: 0 auto;
  padding: 0;
  font-size: 14px;
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  z-index: 3;
  .rc-pagination::after {
    display: block;
    clear: both;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    content: " ";
  }
  .rc-pagination-total-text {
    display: inline-block;
    height: 28px;
    margin-right: 8px;
    line-height: 26px;
    vertical-align: middle;
  }
  .rc-pagination-item {
    display: inline-block;
    min-width: 28px;
    height: 28px;
    margin-right: 8px;
    font-family: Arial;
    line-height: 26px;
    text-align: center;
    vertical-align: middle;
    list-style: none;
    background-color: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    outline: 0;
    cursor: pointer;
    user-select: none;
  }
  .rc-pagination-item a {
    display: block;
    padding: 0 6px;
    color: rgba(0, 0, 0, 0.85);
    transition: none;
  }
  .rc-pagination-item a:hover {
    text-decoration: none;
  }
  .rc-pagination-item:focus,
  .rc-pagination-item:hover {
    border-color: #1890ff;
    transition: all 0.3s;
  }
  .rc-pagination-item:focus a,
  .rc-pagination-item:hover a {
    color: #1890ff;
  }
  .rc-pagination-item-active {
    font-weight: 500;
    background: #ffffff;
    border-color: #1890ff;
  }
  .rc-pagination-item-active a {
    color: #1890ff;
  }
  .rc-pagination-item-active:focus,
  .rc-pagination-item-active:hover {
    border-color: #40a9ff;
  }
  .rc-pagination-item-active:focus a,
  .rc-pagination-item-active:hover a {
    color: #40a9ff;
  }
  .rc-pagination-jump-prev,
  .rc-pagination-jump-next {
    outline: 0;
  }
  .rc-pagination-jump-prev button,
  .rc-pagination-jump-next button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #666;
  }
  .rc-pagination-jump-prev button:after,
  .rc-pagination-jump-next button:after {
    display: block;
    content: "•••";
  }
  .rc-pagination-prev,
  .rc-pagination-jump-prev,
  .rc-pagination-jump-next {
    margin-right: 8px;
  }
  .rc-pagination-prev,
  .rc-pagination-next,
  .rc-pagination-jump-prev,
  .rc-pagination-jump-next {
    display: inline-block;
    min-width: 28px;
    height: 28px;
    color: rgba(0, 0, 0, 0.85);
    font-family: Arial;
    line-height: 28px;
    text-align: center;
    vertical-align: middle;
    list-style: none;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.3s;
  }
  .rc-pagination-prev,
  .rc-pagination-next {
    outline: 0;
  }
  .rc-pagination-prev button,
  .rc-pagination-next button {
    color: rgba(0, 0, 0, 0.85);
    cursor: pointer;
    user-select: none;
  }
  .rc-pagination-prev:hover button,
  .rc-pagination-next:hover button {
    border-color: #40a9ff;
  }
  .rc-pagination-prev .rc-pagination-item-link,
  .rc-pagination-next .rc-pagination-item-link {
    display: block;
    width: 100%;
    height: 100%;
    font-size: 12px;
    text-align: center;
    background-color: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    outline: none;
    transition: all 0.3s;
  }
  .rc-pagination-prev:focus .rc-pagination-item-link,
  .rc-pagination-next:focus .rc-pagination-item-link,
  .rc-pagination-prev:hover .rc-pagination-item-link,
  .rc-pagination-next:hover .rc-pagination-item-link {
    color: #1890ff;
    border-color: #1890ff;
  }
  .rc-pagination-prev button:after {
    content: "‹";
    display: block;
  }
  .rc-pagination-next button:after {
    content: "›";
    display: block;
  }
  .rc-pagination-disabled,
  .rc-pagination-disabled:hover,
  .rc-pagination-disabled:focus {
    cursor: not-allowed;
  }
  .rc-pagination-disabled .rc-pagination-item-link,
  .rc-pagination-disabled:hover .rc-pagination-item-link,
  .rc-pagination-disabled:focus .rc-pagination-item-link {
    color: rgba(0, 0, 0, 0.25);
    border-color: #d9d9d9;
    cursor: not-allowed;
  }
  .rc-pagination-slash {
    margin: 0 10px 0 5px;
  }
  .rc-pagination-options {
    display: inline-block;
    margin-left: 16px;
    vertical-align: middle;
  }
  @media all and (-ms-high-contrast: none) {
    .rc-pagination-options *::-ms-backdrop,
    .rc-pagination-options {
      vertical-align: top;
    }
  }
  .rc-pagination-options-size-changer.rc-select {
    display: inline-block;
    width: auto;
    margin-right: 8px;
  }
  .rc-pagination-options-quick-jumper {
    display: inline-block;
    height: 28px;
    line-height: 28px;
    vertical-align: top;
  }
  .rc-pagination-options-quick-jumper input {
    width: 50px;
    margin: 0 8px;
  }
  .rc-pagination-simple .rc-pagination-prev,
  .rc-pagination-simple .rc-pagination-next {
    height: 24px;
    line-height: 24px;
    vertical-align: top;
  }
  .rc-pagination-simple .rc-pagination-prev .rc-pagination-item-link,
  .rc-pagination-simple .rc-pagination-next .rc-pagination-item-link {
    height: 24px;
    background-color: transparent;
    border: 0;
  }
  .rc-pagination-simple .rc-pagination-prev .rc-pagination-item-link::after,
  .rc-pagination-simple .rc-pagination-next .rc-pagination-item-link::after {
    height: 24px;
    line-height: 24px;
  }
  .rc-pagination-simple .rc-pagination-simple-pager {
    display: inline-block;
    height: 24px;
    margin-right: 8px;
  }
  .rc-pagination-simple .rc-pagination-simple-pager input {
    box-sizing: border-box;
    height: 100%;
    margin-right: 8px;
    padding: 0 6px;
    text-align: center;
    background-color: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    outline: none;
    transition: border-color 0.3s;
  }
  .rc-pagination-simple .rc-pagination-simple-pager input:hover {
    border-color: #1890ff;
  }
  .rc-pagination.rc-pagination-disabled {
    cursor: not-allowed;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item {
    background: #f5f5f5;
    border-color: #d9d9d9;
    cursor: not-allowed;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item a {
    color: rgba(0, 0, 0, 0.25);
    background: transparent;
    border: none;
    cursor: not-allowed;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item-active {
    background: #dbdbdb;
    border-color: transparent;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item-active a {
    color: #ffffff;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item-link {
    color: rgba(0, 0, 0, 0.25);
    background: #f5f5f5;
    border-color: #d9d9d9;
    cursor: not-allowed;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item-link-icon {
    opacity: 0;
  }
  .rc-pagination.rc-pagination-disabled .rc-pagination-item-ellipsis {
    opacity: 1;
  }
  @media only screen and (max-width: 992px) {
    .rc-pagination-item-after-jump-prev,
    .rc-pagination-item-before-jump-next {
      display: none;
    }
  }
  @media only screen and (max-width: 576px) {
    .rc-pagination-options {
      display: none;
    }
  }
`;

const StyledPagination = styled(Pagination)<{
  disabled?: boolean;
}>`
  ${paginatorCss}
  pointer-events: ${(props) => (props.disabled ? "none" : "all")};
  opacity: ${(props) => (props.disabled ? "0.4" : "1")};
`;

interface ListPaginationProps {
  current: number;
  total: number;
  perPage: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}

function ListPagination(props: ListPaginationProps) {
  return (
    <StyledPagination
      current={props.current}
      disabled={props.disabled}
      locale={locale}
      onChange={props.onChange}
      pageSize={props.perPage}
      total={props.total}
    />
  );
}

const PaginationWrapper = styled.ul`
  ${paginatorCss}
  pointer-events: "all";
  opacity: "1";
`;

export function ServerSideListPagination(props: any) {
  return (
    <PaginationWrapper>
      <li
        className={`t--list-widget-prev-page rc-pagination-prev ${props.pageNo ===
          1 && "rc-pagination-disabled"}`}
        title="Previous Page"
      >
        <button
          area-label="prev page"
          className="rc-pagination-item-link"
          onClick={() => {
            if (props.pageNo > 1) props.prevPageClick();
          }}
          type="button"
        />
      </li>
      <li
        className="rc-pagination-item rc-pagination-item-0 rc-pagination-item-active"
        title={props.pageNo}
      >
        <a rel="nofollow">{props.pageNo}</a>
      </li>
      <li
        className="t--list-widget-next-page rc-pagination-next"
        title="Next Page"
      >
        <button
          area-label="next page"
          className="rc-pagination-item-link"
          onClick={() => {
            props.nextPageClick();
          }}
          type="button"
        />
      </li>
    </PaginationWrapper>
  );
}

export default ListPagination;
