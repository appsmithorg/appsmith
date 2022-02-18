import React, { useState, useMemo } from "react";
import styled from "styled-components";
import JSONViewer from "pages/Editor/QueryEditor/JSONViewer";
import Pagination from "../../components/ads/Pagination";

type PaginatedJsonViewerProps = {
  data: unknown;
};

const PaginationContainer = styled.div`
  margin-top: 5px;
  margin-bottom: 5px;
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

function PaginatedJsonViewer(props: PaginatedJsonViewerProps) {
  const data = Array.isArray(props?.data) ? props?.data : [];
  const NO_OF_DATA_PER_PAGE = 100;

  const [currentPage, setCurrentPage] = useState(1);

  const currentPageData = useMemo(() => {
    const firstDataIndex = (currentPage - 1) * NO_OF_DATA_PER_PAGE;
    const lastDataIndex = firstDataIndex + NO_OF_DATA_PER_PAGE;
    return data.slice(firstDataIndex, lastDataIndex);
  }, [currentPage]);

  return (
    <>
      <PaginationContainer>
        <Pagination
          currentPage={currentPage}
          numberOfDataPerPage={NO_OF_DATA_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
          siblingCount={1}
          totalDataCount={data.length}
        />
      </PaginationContainer>
      <JSONViewer src={currentPageData} />
    </>
  );
}

export default PaginatedJsonViewer;
