import React from "react";
import usePagination, { UsePaginationProps } from "../../hooks/usePagination";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";

type Props = UsePaginationProps & {
  onPageChange: (val: number) => void;
};

const PaginationListContainer = styled.ul`
  display: flex;
  list-style-type: none;
`;

const PaginationItem = styled.li<{ selected?: boolean; disabled?: boolean }>`
  padding: 0 12px;
  height: 32px;
  text-align: center;
  margin: auto 4px;
  color: rgba(0, 0, 0, 0.87);
  display: flex;
  box-sizing: border-box;
  align-items: center;
  letter-spacing: 0.01071em;
  border-radius: 16px;
  line-height: 1.43;
  font-size: 13px;
  min-width: 32px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    cursor: pointer;
  }

  ${(props) =>
    props.selected &&
    `
     background-color: rgba(0, 0, 0, 0.08);
  `}

  ${(props) =>
    props.disabled &&
    `
     pointer-events: none;
     &:hover {
         background-color: transparent:
         cursor: default;
     }
  `}
`;

const DottedPaginationItem = styled(PaginationItem)`
  &:hover {
    background-color: transparent;
    cursor: default;
  }
`;

function Pagination(props: Props) {
  const {
    currentPage,
    numberOfDataPerPage,
    onPageChange,
    siblingCount,
    totalDataCount,
  } = props;

  const paginationRange = usePagination({
    currentPage,
    numberOfDataPerPage,
    siblingCount,
    totalDataCount,
  });

  if (currentPage === 0 || paginationRange?.length < 2) return null;

  const onPressNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPressPrevious = () => {
    onPageChange(currentPage - 1);
  };

  const lastPageNumber = paginationRange[paginationRange.length - 1];

  return (
    <PaginationListContainer>
      <PaginationItem disabled={currentPage === 1} onClick={onPressPrevious}>
        <Icon fillColor="black" name="arrow-left" size={IconSize.XXS} />
      </PaginationItem>
      {paginationRange.map((pageNumber: number) => {
        if (pageNumber === -1) {
          return <DottedPaginationItem>&#8230;</DottedPaginationItem>;
        }
        return (
          <PaginationItem
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            selected={currentPage === pageNumber}
          >
            {pageNumber}
          </PaginationItem>
        );
      })}
      <PaginationItem
        disabled={currentPage === lastPageNumber}
        onClick={onPressNext}
      >
        <Icon name="right-arrow-2" />
      </PaginationItem>
    </PaginationListContainer>
  );
}

export default Pagination;
