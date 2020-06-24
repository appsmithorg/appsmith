import React from "react";
import styled from "styled-components";
import { debounce } from "lodash";
import { InputGroup } from "@blueprintjs/core";

interface SearchProps {
  onSearch: (value: any) => void;
  placeholder: string;
  value: string;
}

const SearchInputWrapper = styled(InputGroup)`
  &&& input {
    box-shadow: none;
  }
  &&& svg {
    opacity: 0.6;
  }
  margin: 14px 20px;
  width: 250px;
`;

const SearchComponent = (props: SearchProps) => {
  const handleSearch = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    props.onSearch(event.target.value);
  };
  return (
    <SearchInputWrapper
      leftIcon="search"
      onChange={handleSearch}
      placeholder={props.placeholder}
      value={props.value}
    />
  );
};

export default SearchComponent;
