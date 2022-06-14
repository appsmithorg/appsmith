import React from "react";
import styled from "styled-components";
import { TemplatesContent } from "..";
import Filters from "../Filters";

const Wrapper = styled.div`
  display: flex;
`;

const FilterWrapper = styled.div`
  .filter-wrapper {
    width: 200px;
  }
`;

const ListWrapper = styled.div`
  height: 80vh;
  overflow: auto;
`;

function TemplateList() {
  return (
    <Wrapper>
      <FilterWrapper>
        <Filters />
      </FilterWrapper>
      <ListWrapper>
        <TemplatesContent />
      </ListWrapper>
    </Wrapper>
  );
}

export default TemplateList;
