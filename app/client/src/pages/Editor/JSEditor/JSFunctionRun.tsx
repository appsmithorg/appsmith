import React from "react";
import styled from "styled-components";
import Dropdown, {
  DropdownOnSelect,
  DropdownContainer,
} from "components/ads/Dropdown";
import Button from "components/ads/Button";
import FlagBadge from "components/utils/FlagBadge";
import { JSCollection } from "entities/JSCollection";
import Tooltip from "components/ads/Tooltip";
import { createMessage, NO_JS_FUNCTION_TO_RUN } from "ce/constants/messages";
import { StyledButton } from "components/ads/Button";
import { JSActionDropdownOption } from "./utils";
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
    margin-left: ${RUN_BUTTON_DEFAULTS.GAP_SIZE};
    padding: 0px 20px;

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
        height={RUN_BUTTON_DEFAULTS.HEIGHT}
        onSelect={onSelect}
        options={options}
        selected={selected}
        selectedHighlightBg={RUN_BUTTON_DEFAULTS.DROPDOWN_HIGHLIGHT_BG}
        showLabelOnly
        truncateOption
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
          tag="button"
          text={RUN_BUTTON_DEFAULTS.CTA_TEXT}
        />
      </Tooltip>
    </DropdownWithCTAWrapper>
  );
}
