import React from "react";
import styled from "styled-components";
import FlagBadge from "components/utils/FlagBadge";
import type { JSCollection } from "entities/JSCollection";
import type { DropdownOnSelect } from "design-system-old";
import {
  Button,
  Dropdown,
  DropdownContainer,
  Size,
  StyledButton,
  TooltipComponent as Tooltip,
} from "design-system-old";
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
  onSelect: DropdownOnSelect;
  options: JSActionDropdownOption[];
  selected: JSActionDropdownOption;
  showTooltip: boolean;
};

export type DropdownWithCTAWrapperProps = {
  isDisabled: boolean;
};
const disabledStyles = `
opacity: 0.5;
pointer-events:none;
`;

const DropdownWithCTAWrapper = styled.div<DropdownWithCTAWrapperProps>`
  display: flex;

  ${StyledButton} {
    ${(props) =>
      props.isDisabled &&
      `
    ${disabledStyles}
    `}
  }
  ${DropdownContainer} {
    ${(props) =>
      props.isDisabled &&
      `
      ${disabledStyles}
    `}
  }
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
      <Dropdown
        customBadge={<FlagBadge name="Async" />}
        cypressSelector="function-select-dropdown"
        height={RUN_BUTTON_DEFAULTS.HEIGHT}
        onSelect={onSelect}
        options={options}
        selected={selected}
        selectedHighlightBg={RUN_BUTTON_DEFAULTS.DROPDOWN_HIGHLIGHT_BG}
        showLabelOnly
        truncateOption
        width="232px"
      />

      <Tooltip
        content={createMessage(NO_JS_FUNCTION_TO_RUN, jsCollection.name)}
        disabled={!showTooltip}
        hoverOpenDelay={50}
      >
        <Button
          className={testLocators.runJSAction}
          height={RUN_BUTTON_DEFAULTS.HEIGHT}
          isLoading={isLoading}
          onClick={onButtonClick}
          size={Size.medium}
          tag="button"
          text={RUN_BUTTON_DEFAULTS.CTA_TEXT}
          type="button"
        />
      </Tooltip>
    </DropdownWithCTAWrapper>
  );
}
