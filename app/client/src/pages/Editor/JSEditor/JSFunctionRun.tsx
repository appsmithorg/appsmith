import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOnSelect } from "components/ads/Dropdown";
import Button from "components/ads/Button";
import FlagBadge from "components/utils/FlagBadge";
import { JSCollection } from "entities/JSCollection";
import Tooltip from "components/ads/Tooltip";
import { createMessage, NO_JS_FUNCTION_TO_RUN } from "ce/constants/messages";
import { StyledButton } from "components/ads/Button";
import { JSActionDropdownOption } from "./utils";
import { DEFAULTS } from "./constants";

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

const DropdownWithCTAWrapper = styled.div<DropdownWithCTAWrapperProps>`
  display: flex;

  ${(props) =>
    props.isDisabled &&
    `
    opacity: 0.5;
    pointer-events:none;
    `}

  ${StyledButton} {
    margin-left: ${DEFAULTS.GAP_SIZE};
    padding: 0px 20px;
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
    <Tooltip
      content={createMessage(NO_JS_FUNCTION_TO_RUN, jsCollection.name)}
      disabled={!showTooltip}
      hoverOpenDelay={50}
    >
      <DropdownWithCTAWrapper isDisabled={disabled}>
        <Dropdown
          customBadge={<FlagBadge name="Aysnc" />}
          height={DEFAULTS.HEIGHT}
          onSelect={onSelect}
          options={options}
          selected={selected}
          showLabelOnly
          truncateOption
        />

        <Button
          height={DEFAULTS.HEIGHT}
          isLoading={isLoading}
          onClick={onButtonClick}
          tag="button"
          text={DEFAULTS.CTA_TEXT}
        />
      </DropdownWithCTAWrapper>
    </Tooltip>
  );
}
