import type { MutableRefObject } from "react";
import React, { useRef } from "react";
import type { DropdownOption } from "design-system-old";
import {
  Classes,
  Dropdown,
  TextInput,
  TooltipComponent,
} from "design-system-old";
import styled from "styled-components";
import { useDispatch } from "react-redux";

import { clearLogs } from "actions/debuggerActions";
import { CLEAR_LOG_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Button } from "design-system";

const Wrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: flex-start;
  padding: 8px 0;
  margin-left: 16px;
  margin-right: 16px;

  .debugger-clear-logs {
    display: flex;
    align-items: center;
  }

  .debugger-search {
    height: 32px;
  }

  .debugger-filter {
    width: 220px;
    height: 32px;
    min-height: 32px;
  }

  .input-container {
    display: flex;
    max-width: 560px;
    min-width: 220px;
    flex-grow: 1;
    height: 32px;
    align-items: center;
    margin: 0px 24px;
    .${Classes.ICON} {
      margin-left: -32px;
      z-index: 2;
    }
  }
`;

type FilterHeaderProps = {
  options: DropdownOption[];
  selected: DropdownOption;
  onChange: (value: string) => void;
  onSelect: (value?: string) => void;
  defaultValue: string;
  value: string;
  searchQuery: string;
};

function FilterHeader(props: FilterHeaderProps) {
  const dispatch = useDispatch();
  const searchRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
  return (
    <Wrapper>
      <TooltipComponent
        className="debugger-clear-logs"
        content={createMessage(CLEAR_LOG_TOOLTIP)}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position="bottom"
      >
        <Button
          className="t--debugger-clear-logs"
          isIconButton
          kind="tertiary"
          onClick={() => dispatch(clearLogs())}
          size="sm"
          startIcon="cancel"
        />
      </TooltipComponent>
      <div className="input-container">
        <TextInput
          className="debugger-search"
          cypressSelector="t--debugger-search"
          defaultValue={props.defaultValue}
          height="32px"
          onChange={props.onChange}
          placeholder="Filter"
          ref={searchRef}
          value={props.value}
          width="100%"
        />
        {props.searchQuery && (
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => {
              if (searchRef.current) {
                props.onChange("");
                searchRef.current.value = "";
              }
            }}
            size="sm"
            startIcon="cross"
          />
        )}
      </div>
      <Dropdown
        className="debugger-filter"
        height="32px"
        onSelect={props.onSelect}
        optionWidth="220px"
        options={props.options}
        selected={props.selected}
        showLabelOnly
        width="220px"
      />
    </Wrapper>
  );
}

export default FilterHeader;
