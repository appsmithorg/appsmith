import React from "react";
import Dropdown from "components/ads/Dropdown";
import TextInput from "components/ads/TextInput";
import styled from "styled-components";

const Wrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: flex-start;
  margin-left: 30px;
  padding: 5px 0;
  & > div {
    width: 160px;
    margin-right: 16px;
  }

  .debugger-search {
    height: 28px;
    width: 160px;
  }

  .debugger-filter {
    background: transparent;
    border: none;
    box-shadow: none;
    width: 100px;
  }
`;

const FilterHeader = (props: any) => {
  return (
    <Wrapper>
      <TextInput
        className="debugger-search"
        placeholder="Filter"
        onChange={props.onChange}
      />
      <Dropdown
        className="debugger-filter"
        width={"100px"}
        height={"28px"}
        optionWidth={"100px"}
        options={props.options}
        showLabelOnly
        selected={props.selected}
        onSelect={props.onSelect}
      />
    </Wrapper>
  );
};

export default FilterHeader;
