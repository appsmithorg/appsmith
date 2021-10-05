import React from "react";
import NoDataImage from "assets/images/no_data.png";
import styled from "constants/DefaultTheme";

const TableColumnEmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    width: 156px;
    margin-top: 16px;
  }
  .no-data-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.04em;
    color: #ffffff;
    margin-top: 23px;
  }
`;

function EmptyDataState() {
  return (
    <TableColumnEmptyWrapper>
      <img alt="No data" src={NoDataImage} />
      <div className="no-data-title">No data found</div>
    </TableColumnEmptyWrapper>
  );
}

export default EmptyDataState;
