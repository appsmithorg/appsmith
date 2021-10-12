import React from "react";
import styled from "styled-components";
import { InputGroup } from "@blueprintjs/core";
import { debounce } from "lodash";
import { Colors } from "constants/Colors";
import Icon from "components/ads/Icon";

interface SearchProps {
  onSearch: (value: any) => void;
  placeholder: string;
  value: string;
  className?: string;
}

const SearchInputWrapper = styled(InputGroup)`
  &&& input {
    box-shadow: none;
    font-size: 12px;
    color: ${Colors.SILVER_CHALICE};
  }
  &&& svg {
    path {
      fill: ${Colors.SILVER_CHALICE};
    }
  }
  &&& .bp3-input-action .close {
    width: 34px;
    height: 34px;
    margin-right: 1px;
    margin-left: 1px;
    margin-top: 1px;
    justify-content: center;
    transition: 0.2s all ease;

    svg {
      width: 18px;
      height: 18px;
      path {
        fill: ${Colors.GREY_6};
      }
    }
    &:hover {
      background-color: ${Colors.GREY_2};
      svg {
        path {
          fill: ${Colors.GREY_10};
        }
      }
    }
  }
  margin: 5px 16px;
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
        className={`${this.props.className} t--search-input`}
        leftIcon="search"
        onChange={this.handleSearch}
        placeholder={this.props.placeholder}
        rightElement={<Icon className="close" name="close-x" />}
        value={this.state.localValue}
      />
    );
  }
}

export default SearchComponent;
