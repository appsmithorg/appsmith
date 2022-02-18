import { useMemo } from "react";

export type UsePaginationProps = {
  totalDataCount: number;
  numberOfDataPerPage: number;
  siblingCount?: number;
  currentPage: number;
};

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;

  return Array.from({ length }, (_, index: number) => index + start);
};

const usePagination = (props: UsePaginationProps) => {
  const {
    currentPage,
    numberOfDataPerPage,
    siblingCount = 1,
    totalDataCount,
  } = props;

  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalDataCount / numberOfDataPerPage);

    const totalPageNumbers = siblingCount + 5; // number of visible page numbers

    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount,
    );
    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    // -1 is used to represent "DOTS" (adding dots to the array of paginated number ranges)

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, -1, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount,
      );
      return [firstPageIndex, -1, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, -1, ...middleRange, -1, lastPageIndex];
    }
  }, [totalDataCount, numberOfDataPerPage, siblingCount, currentPage]);

  return paginationRange ? paginationRange : [];
};

export default usePagination;
