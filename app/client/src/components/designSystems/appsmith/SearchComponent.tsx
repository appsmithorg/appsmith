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
`;

const SearchComponent = (props: SearchProps) => {
  const [value, setValue] = React.useState(props.value);
  const handleSearch = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const search = event.target.value;
    setValue(search);
    props.onSearch(search);
  };
  return (
    <SearchInputWrapper
      leftIcon="search"
      onChange={handleSearch}
      placeholder={props.placeholder}
      value={value}
    />
  );
};

export default SearchComponent;
