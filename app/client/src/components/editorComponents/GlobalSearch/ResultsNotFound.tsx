import React from "react";
import styled from "styled-components";
import NoSearchDataImage from "assets/images/no_search_data.png";
import { NO_SEARCH_DATA_TEXT } from "constants/messages";
import { getTypographyByKey } from "constants/DefaultTheme";

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  ${(props) => getTypographyByKey(props, "spacedOutP1")}
  color: ${(props) => props.theme.colors.globalSearch.emptyStateText};

  .no-data-title {
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ResultsNotFound = () => (
  <Container>
    <img alt="No data" src={NoSearchDataImage} />
    <div className="no-data-title">{NO_SEARCH_DATA_TEXT}</div>
  </Container>
);

export default ResultsNotFound;
