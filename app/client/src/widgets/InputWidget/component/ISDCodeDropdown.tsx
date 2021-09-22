import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes";

const DropdownTriggerIconWrapper = styled.div<{ disabled?: boolean }>`
  padding: 9px 0px 9px 12px;
  width: 85px;
  min-width: 85px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  height: 32px;
  line-height: ${(props) => (props.disabled ? 32 : 18)}px;
  letter-spacing: -0.24px;
  color: #090707;
  position: ${(props) => props.disabled && "absolute"};
  .code {
    margin-right: 4px;
    pointer-events: none;
  }
  .icon-dropdown {
    opacity: ${(props) => props.disabled && "0.6"};
    display: flex;
    width: 30px;
    justify-content: space-between;
  }
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
      <div className="icon-dropdown">
        {selectedCountry.value && countryToFlag(selectedCountry.value)}
        <Icon name="downArrow" size={IconSize.XXS} />
      </div>
      <div className="code">{selectedCountry.id && selectedCountry.id}</div>
    </DropdownTriggerIconWrapper>
  );
  if (props.disabled) {
    return dropdownTrigger;
  }
  return (
    <Dropdown
      containerClassName="country-type-filter"
      dropdownHeight="195px"
      dropdownTriggerIcon={dropdownTrigger}
      enableSearch
      height="32px"
      onSelect={props.onISDCodeChange}
      optionWidth="260px"
      options={props.options}
      searchPlaceholder="Search by ISD code or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
