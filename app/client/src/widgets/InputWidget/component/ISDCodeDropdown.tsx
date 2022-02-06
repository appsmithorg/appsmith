import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes";
import { Colors } from "constants/Colors";

const DropdownTriggerIconWrapper = styled.div<{ disabled?: boolean }>`
  padding: 7px;
  width: 92px;
  min-width: 92px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  height: 36px;
  line-height: ${(props) => (props.disabled ? 36 : 18)}px;
  letter-spacing: -0.24px;
  color: #090707;
  position: ${(props) => props.disabled && "absolute"};

  .dropdown {
    svg {
      width: 14px;
      height: 14px;

      path {
        fill: ${Colors.GREY_10} !important;
      }
    }
  }
`;

const FlagWrapper = styled.span`
  font-size: 20px;
  line-height: 19px;
`;

const getISDCodeOptions = (): Array<DropdownOption> => {
  return ISDCodeOptions.map((item: ISDCodeProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.name,
      label: `${item.name} (${item.dial_code})`,
      value: item.code,
      id: item.dial_code,
    };
  });
};

export const ISDCodeDropdownOptions = getISDCodeOptions();

export const getSelectedISDCode = (code?: string): DropdownOption => {
  let selectedCountry: ISDCodeProps | undefined = code
    ? ISDCodeOptions.find((item: ISDCodeProps) => {
        return item.code === code;
      })
    : undefined;
  if (!selectedCountry) {
    selectedCountry = {
      name: "United States",
      dial_code: "+1",
      code: "US",
    };
  }
  return {
    label: `${selectedCountry.name} (${selectedCountry.dial_code})`,
    searchText: selectedCountry.name,
    value: selectedCountry.code,
    id: selectedCountry.dial_code,
  };
};

interface ISDCodeDropdownProps {
  onISDCodeChange: (code?: string) => void;
  options: Array<DropdownOption>;
  selected: DropdownOption;
  allowCountryCodeChange?: boolean;
  disabled: boolean;
}

export default function ISDCodeDropdown(props: ISDCodeDropdownProps) {
  const selectedCountry = getSelectedISDCode(props.selected.value);
  const dropdownTrigger = (
    <DropdownTriggerIconWrapper
      className="t--input-country-code-change"
      disabled={props.disabled}
    >
      <FlagWrapper>
        {selectedCountry.value && countryToFlag(selectedCountry.value)}
      </FlagWrapper>
      <div className="code">{selectedCountry.id && selectedCountry.id}</div>
      <Icon className="dropdown" name="down-arrow" size={IconSize.XXS} />
    </DropdownTriggerIconWrapper>
  );
  if (props.disabled) {
    return dropdownTrigger;
  }
  return (
    <Dropdown
      containerClassName="country-type-filter"
      dropdownHeight="139px"
      dropdownTriggerIcon={dropdownTrigger}
      enableSearch
      height="36px"
      onSelect={props.onISDCodeChange}
      optionWidth="340px"
      options={props.options}
      searchPlaceholder="Search by ISD code or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
