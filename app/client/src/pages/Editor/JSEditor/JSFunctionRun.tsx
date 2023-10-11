import React from "react";
import styled from "styled-components";
import type { JSCollection } from "entities/JSCollection";
import type { SelectProps } from "design-system";
import { Button, Option, Select, Tooltip, Text } from "design-system";
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

  &&&&& .function-select-dropdown {
    width: 230px;
  }
`;

const OptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const OptionLabelWrapper = styled.div<{ fullSize?: boolean }>`
  width: ${(props) => (props?.fullSize ? "100%" : "80%")};
  overflow: hidden;
`;

const OptionLabel = styled(Text)`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
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
        isDisabled={disabled}
        onSelect={onSelect}
        size="md"
        value={
          selected.label && {
            key: selected.label,
            label: (
              <OptionLabelWrapper fullSize>
                <OptionLabel renderAs="p">{selected.label}</OptionLabel>
              </OptionLabelWrapper>
            ),
          }
        }
        virtual={false}
      >
        {options.map((option) => (
          <Option key={option.value}>
            <OptionWrapper>
              <Tooltip
                content={option.label}
                // Here, 18 is the maximum charecter length because the width of this menu does not change
                isDisabled={(option.label?.length || 0) < 18}
                placement="right"
              >
                <OptionLabelWrapper>
                  <OptionLabel renderAs="p">{option.label}</OptionLabel>
                </OptionLabelWrapper>
              </Tooltip>
            </OptionWrapper>
          </Option>
        ))}
      </Select>
      <Tooltip
        content={createMessage(NO_JS_FUNCTION_TO_RUN, jsCollection.name)}
        isDisabled={!showTooltip}
        placement="topRight"
      >
        {/* this span exists to make the disabled button visible to the tooltip */}
        <span>
          <Button
            className={testLocators.runJSAction}
            isDisabled={disabled}
            isLoading={isLoading}
            onClick={onButtonClick}
            size="md"
          >
            {RUN_BUTTON_DEFAULTS.CTA_TEXT}
          </Button>
        </span>
      </Tooltip>
    </DropdownWithCTAWrapper>
  );
}
