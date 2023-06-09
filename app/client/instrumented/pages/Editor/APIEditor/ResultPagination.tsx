import React from "react";
import Pagination from "react-paginating";
import styled from "styled-components";
import { theme } from "constants/DefaultTheme";

interface ResultPaginationProps {
  total: number;
  handlePageChange: (page: number | undefined) => void;
  currentPage: number | undefined;
}

type Props = ResultPaginationProps;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;

  .item {
    display: flex;
    font-size: 14px;
    justify-content: center;
    background-color: white;
    width: 30px;
    align-items: center;
    height: 30px;
    border: 1.5px solid #dcdcdc;
    margin: 0 5px;
    cursor: pointer;
    border-radius: 5px;
  }
`;

class ResultPagination extends React.Component<Props> {
  render() {
    const { currentPage = 1, handlePageChange, total } = this.props;

    return (
      <Pagination limit={40} pageCount={5} total={total}>
        {({
          getPageItemProps,
          hasNextPage,
          hasPreviousPage,
          nextPage,
          pages,
          previousPage,
          totalPages,
        }) => {
          return (
            <PaginationContainer>
              <div
                className="item"
                {...getPageItemProps({
                  total: totalPages,
                  pageValue: previousPage,
                  onPageChange: hasPreviousPage ? handlePageChange : () => null,
                  style: !hasPreviousPage
                    ? {
                        backgroundColor: "#DCDCDC",
                        cursor: "not-allowed",
                      }
                    : {},
                })}
              >
                {"<"}
              </div>

              {pages.map((page, index) => {
                let activePage = undefined;
                if (currentPage === page) {
                  activePage = {
                    borderColor: theme.colors.primaryOld,
                  };
                }
                return (
                  <div
                    className="item"
                    key={`marketPlace${index}`}
                    {...getPageItemProps({
                      total: totalPages,
                      pageValue: page,
                      style: activePage,
                      onPageChange: handlePageChange,
                    })}
                  >
                    {page}
                  </div>
                );
              })}

              <div
                className="item"
                {...getPageItemProps({
                  total: totalPages,
                  pageValue: nextPage,
                  onPageChange: hasNextPage ? handlePageChange : () => null,
                  style: !hasNextPage
                    ? {
                        backgroundColor: "#DCDCDC",
                        cursor: "not-allowed",
                      }
                    : {},
                })}
              >
                {">"}
              </div>
            </PaginationContainer>
          );
        }}
      </Pagination>
    );
  }
}

export default ResultPagination;
