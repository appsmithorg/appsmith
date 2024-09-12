import React from "react";
import styled from "styled-components";
import { InputGroup } from "@blueprintjs/core";
import { debounce } from "lodash";
import { importSvg } from "../utils/icon-loadables";

const CrossIcon = importSvg(
  async () => import("../assets/icons/ads/cross.svg"),
);

interface SearchProps {
  onSearch: (value: any) => void;
  placeholder: string;
  value: string;
  className?: string;
  autoFocus?: boolean;
}

const SearchComponentWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const CrossIconWrapper = styled.div`
  width: 20px;
  height: 20px;
  position: absolute;
  cursor: pointer;
  top: 5px;
  right: 5px;
  .cross-icon {
    width: 10px;
    height: 10px;
    position: absolute;
    top: 5px;
    left: 5px;
  }
`;

// Firefox doesn't have a default search cancel button
const HideDefaultSearchCancelIcon = `
    // chrome, safari
    input[type="search"]::-webkit-search-cancel-button {
      -webkit-appearance: none;
    }

    // MS-edge
    input[type="search"]::-ms-clear {
      appearance: none;
    }
`;

const SearchInputWrapper = styled(InputGroup)<{
  children?: React.ReactNode;
}>`
  &&& {
    input {
      border-radius: 0;
      box-shadow: none;
      font-size: 12px;
      color: var(--ads-old-color-gray-10);
      padding-right: 20px;
      text-overflow: ellipsis;
      width: 100%;
    }
    input:focus {
      border: 1.2px solid var(--ads-old-color-fern-green);
      box-sizing: border-box;
      width: 100%;
    }

    input:active {
      box-shadow: 0px 0px 0px 3px var(--ads-old-color-jagged-ice);
    }
    ${HideDefaultSearchCancelIcon}
    svg {
      path {
        fill: var(--ads-old-color-gray-7);
      }
    }
  }
  width: 100%;
`;

class SearchComponent extends React.Component<
  SearchProps,
  { localValue: string }
> {
  private inputRef = React.createRef<HTMLInputElement>(); 
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
  clearSearch = () => {
    this.setState({ localValue: "" });
    this.onDebouncedSearch("");
    if (this.inputRef.current) {
      this.inputRef.current.focus(); 
    }
  };

  render() {
    return (
      <SearchComponentWrapper>
        <SearchInputWrapper
          inputRef={this.inputRef} 
          autoFocus={this.props.autoFocus}
          className={`${this.props.className} t--search-input`}
          leftIcon="search"
          onChange={this.handleSearch}
          placeholder={this.props.placeholder}
          type="search"
          value={this.state.localValue}
        />
        {this.state.localValue && (
          <CrossIconWrapper onClick={this.clearSearch}>
            <CrossIcon className="cross-icon" />
          </CrossIconWrapper>
        )}
      </SearchComponentWrapper>
    );
  }
}

export default SearchComponent;
