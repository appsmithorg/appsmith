import React from "react";
import styled from "styled-components";
import TemplateList from "./TemplateList";

const TemplateListWrapper = styled.div`
  padding-top: 26px;
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
`;

const ResultsCount = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: #090707;
  margin-top: 26px;
  margin-left: 32px;
`;

function Templates() {
  return (
    <TemplateListWrapper>
      <ResultsCount>Showing all 20 templates</ResultsCount>
      <TemplateList />
    </TemplateListWrapper>
  );
}

export default Templates;
