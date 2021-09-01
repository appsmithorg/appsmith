import React, { MutableRefObject, useRef } from "react";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import TextInput from "components/ads/TextInput";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { useDispatch } from "react-redux";

import { clearLogs } from "actions/debuggerActions";
import { Classes } from "components/ads/common";

const Wrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: flex-start;
  margin-left: 30px;
  padding: 5px 0;
  & > div {
    width: 160px;
    margin: 0 16px;
  }

  .debugger-search {
    height: 28px;
    width: 160px;
    padding-right: 25px;
  }

  .debugger-filter {
    background: transparent;
    border: none;
    box-shadow: none;
    width: 100px;
  }

  .input-container {
    position: relative;
    .${Classes.ICON} {
      position: absolute;
      right: 9px;
      top: 9px;
    }
  }
`;

type FilterHeaderProps = {
  options: DropdownOption[];
  selected: DropdownOption;
  onChange: (value: string) => void;
  onSelect: (value?: string) => void;
  defaultValue: string;
  searchQuery: string;
};

function FilterHeader(props: FilterHeaderProps) {
  const dispatch = useDispatch();
  const searchRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  return (
    <Wrapper>
      <Icon
        name="cancel"
        onClick={() => dispatch(clearLogs())}
        size={IconSize.XL}
      />
      <div className="input-container">
        <TextInput
          className="debugger-search"
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          placeholder="Filter"
          ref={searchRef}
        />
        {props.searchQuery && (
          <Icon
            name="close"
            onClick={() => {
              if (searchRef.current) {
                props.onChange("");
                searchRef.current.value = "";
              }
            }}
          />
        )}
      </div>
      <Dropdown
        className="debugger-filter"
        height={"28px"}
        onSelect={props.onSelect}
        optionWidth={"100px"}
        options={props.options}
        selected={props.selected}
        showLabelOnly
        width={"100px"}
      />
    </Wrapper>
  );
}

export default FilterHeader;
