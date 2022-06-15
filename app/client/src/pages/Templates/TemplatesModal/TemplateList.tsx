import { importTemplateIntoApplication } from "actions/templateActions";
import React from "react";
import { useDispatch } from "react-redux";
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
  const dispatch = useDispatch();
  const onTemplateClick = () => {
    // console.log("onTemplateClick");
  };
  const onForkTemplateClick = (id: string) => {
    dispatch(importTemplateIntoApplication(id));
  };

  return (
    <Wrapper>
      <FilterWrapper>
        <Filters />
      </FilterWrapper>
      <ListWrapper>
        <TemplatesContent
          onForkTemplateClick={onForkTemplateClick}
          onTemplateClick={onTemplateClick}
        />
      </ListWrapper>
    </Wrapper>
  );
}

export default TemplateList;
