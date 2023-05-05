import React from "react";
import styled from "styled-components";
import FlagBadge from "components/utils/FlagBadge";
import type { JSCollection } from "entities/JSCollection";
import type { SelectProps } from "design-system";
import { Button, Option, Select, Tooltip } from "design-system";
import {
  createMessage,
  NO_JS_FUNCTION_TO_RUN,
} from "@appsmith/constants/messages";
import type { JSActionDropdownOption } from "./utils";
import { RUN_BUTTON_DEFAULTS, testLocators } from "./constants";

type Props = {
  disabled: boolean;
  isLoading: boolean;
  jsCollection: JSCollection;
  onButtonClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onSelect: SelectProps["onSelect"];
  options: JSActionDropdownOption[];
  selected: JSActionDropdownOption;
  showTooltip: boolean;
};

export type DropdownWithCTAWrapperProps = {
  isDisabled: boolean;
};

const DropdownWithCTAWrapper = styled.div<DropdownWithCTAWrapperProps>`
  display: flex;
  gap: 10px;
`;

const OptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export function JSFunctionRun({
  disabled,
  isLoading,
  jsCollection,
  onButtonClick,
  onSelect,
  options,
  selected,
  showTooltip,
}: Props) {
  return (
    <DropdownWithCTAWrapper isDisabled={disabled}>
      <Select
        className="function-select-dropdown"
        onSelect={onSelect}
        size="md"
        value={selected.label}
      >
        {options.map((option) => (
          <Option key={option.value}>
            <OptionWrapper>
              <div>{option.label}</div>
              {option.hasCustomBadge && <FlagBadge name="Async" />}
            </OptionWrapper>
          </Option>
        ))}
      </Select>
      <Tooltip
        content={createMessage(NO_JS_FUNCTION_TO_RUN, jsCollection.name)}
        placement="topRight"
        visible={showTooltip}
      >
        <Button
          className={testLocators.runJSAction}
          isDisabled={disabled}
          isLoading={isLoading}
          onClick={onButtonClick}
          size="md"
        >
          {RUN_BUTTON_DEFAULTS.CTA_TEXT}
        </Button>
      </Tooltip>
    </DropdownWithCTAWrapper>
  );
}
