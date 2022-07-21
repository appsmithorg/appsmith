import React, { MutableRefObject, useRef } from "react";
import { get } from "lodash";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import TextInput from "components/ads/TextInput";
import styled, { useTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { useDispatch } from "react-redux";

import { clearLogs } from "actions/debuggerActions";
import { Classes } from "components/ads/common";
import { TooltipComponent } from "design-system";
import { CLEAR_LOG_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Classes as BlueprintClasses } from "@blueprintjs/core";

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
    border: none;
    box-shadow: none;
    width: 110px;
    height: 28px;
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
    .${Classes.ICON} {
      position: absolute;
      right: 9px;
    }
  }

  .${BlueprintClasses.POPOVER_WRAPPER} {
    display: flex;
    align-items: center;
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
  const theme = useTheme();
  return (
    <Wrapper>
      <TooltipComponent
        content={createMessage(CLEAR_LOG_TOOLTIP)}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position="bottom"
      >
        <Icon
          name="cancel"
          onClick={() => dispatch(clearLogs())}
          size={IconSize.XL}
        />
      </TooltipComponent>
      <div className="input-container">
        <TextInput
          className="debugger-search"
          cypressSelector="t--debugger-search"
          defaultValue={props.defaultValue}
          height="28px"
          onChange={props.onChange}
          placeholder="Filter"
          ref={searchRef}
          width="160px"
        />
        {props.searchQuery && (
          <Icon
            fillColor={get(theme, "colors.debugger.jsonIcon")}
            hoverFillColor={get(theme, "colors.debugger.message")}
            name="close-circle"
            onClick={() => {
              if (searchRef.current) {
                props.onChange("");
                searchRef.current.value = "";
              }
            }}
            size={IconSize.XXL}
          />
        )}
      </div>
      <Dropdown
        className="debugger-filter"
        onSelect={props.onSelect}
        optionWidth="115px"
        options={props.options}
        selected={props.selected}
        showLabelOnly
        width="115px"
      />
    </Wrapper>
  );
}

export default FilterHeader;
