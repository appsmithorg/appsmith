import React from "react";
import styled from "styled-components";
import { InputGroup } from "@blueprintjs/core";
import { debounce } from "lodash";

interface SearchProps {
  onSearch: (value: any) => void;
  placeholder: string;
  value: string;
}

const SearchInputWrapper = styled(InputGroup)`
  &&& input {
    box-shadow: none;
    font-size: 12px;
  }
  &&& svg {
    opacity: 0.6;
  }
  margin: 5px 20px;
  width: 250px;
  min-width: 150px;
`;

class SearchComponent extends React.Component<
  SearchProps,
  { localValue: string }
> {
  onDebouncedSearch = debounce(this.props.onSearch, 400);
  constructor(props: SearchProps) {
    super(props);
    this.state = {
      localValue: props.value,
    };
  }
  componentDidUpdate(prevProps: Readonly<SearchProps>) {
    // Reset local state if the value has updated via default value
    if (prevProps.value !== this.props.value) {
      this.setState({ localValue: this.props.value });
    }
  }

  handleSearch = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const search = event.target.value;
    this.setState({ localValue: search });
    this.onDebouncedSearch(search);
  };
  render() {
    return (
      <SearchInputWrapper
        leftIcon="search"
        type="search"
        onChange={this.handleSearch}
        placeholder={this.props.placeholder}
        value={this.state.localValue}
      />
    );
  }
}

export default SearchComponent;
