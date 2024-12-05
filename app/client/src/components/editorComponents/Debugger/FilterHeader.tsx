import type { MutableRefObject } from "react";
import React, { useRef } from "react";
import type { DropdownOption } from "@appsmith/ads-old";
import styled from "styled-components";
import { useDispatch } from "react-redux";

import { clearLogs } from "actions/debuggerActions";
import { CLEAR_LOG_TOOLTIP, createMessage } from "ee/constants/messages";
import {
  Button,
  Icon,
  Option,
  SearchInput,
  Select,
  Tooltip,
  Text,
} from "@appsmith/ads";

const Wrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  padding: var(--ads-v2-spaces-4);
  border-bottom: 1px solid var(--ads-v2-color-border);

  .debugger-filter {
    width: 220px;
  }

  .debugger-filter .rc-select-selector {
    height: 28px;
  }

  .t--debugger-clear-logs {
    margin-left: auto;
  }

  .input-container {
    max-width: 560px;
    min-width: 220px;
    flex-grow: 1;
  }
`;

const OptionLabel = styled(Text)`
  margin-top: 2px;
`;

interface FilterHeaderProps {
  options: DropdownOption[];
  selected: DropdownOption;
  onChange: (value: string) => void;
  onSelect: (value?: string) => void;
  defaultValue: string;
  value: string;
  searchQuery: string;
}

function FilterHeader(props: FilterHeaderProps) {
  const dispatch = useDispatch();
  const searchRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  return (
    <Wrapper>
      <Select
        className="debugger-filter"
        data-testid="t--log-filter"
        onSelect={props.onSelect}
        size="sm"
        value={{
          key: props.selected.value,
          label: (
            <OptionLabel kind="body-s" renderAs="p">
              {props.selected.label}
            </OptionLabel>
          ),
        }}
      >
        {props.options.map((option) => (
          <Option
            aria-label={option.label}
            data-testid={`t--log-filter-${option.label}`}
            key={option.value}
            value={option.value}
          >
            {option.icon && (
              <Icon color={option?.iconColor} name={option.icon} />
            )}
            {option.label}
          </Option>
        ))}
      </Select>
      <div className="input-container">
        <SearchInput
          className="debugger-search"
          data-testid="t--debugger-search"
          onChange={props.onChange}
          placeholder="Filter"
          ref={searchRef}
          value={props.value}
        />
      </div>
      <Tooltip
        className="debugger-clear-logs"
        content={createMessage(CLEAR_LOG_TOOLTIP)}
        placement="bottom"
      >
        <Button
          className="t--debugger-clear-logs"
          isIconButton
          kind="tertiary"
          onClick={() => dispatch(clearLogs())}
          size="sm"
          startIcon="clear"
        />
      </Tooltip>
    </Wrapper>
  );
}

export default FilterHeader;
