import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "components/designSystems/blueprint/InputComponent/utilties";
import {
  DialingCodeOptions,
  DialingCodeOptionProps,
} from "constants/DialingCodes";

const DropdownTriggerIconWrapper = styled.div`
  height: 19px;
  padding: 9px 0px 9px 12px;
  width: 85px;
  min-width: 85px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  color: #090707;
  .code {
    margin-right: 4px;
    pointer-events: none;
  }
  .icon-dropdown {
    display: flex;
    width: 30px;
    justify-content: space-between;
  }
`;

export const getPhoneNumberCodeOptions = (): Array<DropdownOption> => {
  return DialingCodeOptions.map((item: DialingCodeOptionProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.name,
      label: `${item.name} (${item.dial_code})`,
      value: item.dial_code,
    };
  });
};

export const getSelectedCountryCode = (
  countryCode?: string,
): DropdownOption => {
  const selectedCountry: DialingCodeOptionProps =
    (countryCode
      ? DialingCodeOptions.find((item: DialingCodeOptionProps) => {
          return item.dial_code === countryCode;
        })
      : undefined) || DialingCodeOptions[0];
  return {
    label: `${selectedCountry.name} (${selectedCountry.dial_code})`,
    searchText: selectedCountry.name,
    value: selectedCountry.dial_code,
    id: selectedCountry.code,
  };
};

interface CountryCodeDropdownProps {
  onCountryCodeChange: (code?: string) => void;
  options: Array<DropdownOption>;
  selected: DropdownOption;
  allowCountryCodeChange?: boolean;
}

export default function PhoneNumberTypeDropdown(
  props: CountryCodeDropdownProps,
) {
  const selectedCountry = getSelectedCountryCode(props.selected.value);
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-country-code-change">
      <div className="icon-dropdown">
        {selectedCountry.id && countryToFlag(selectedCountry.id)}
        <Icon name="downArrow" size={IconSize.XXS} />
      </div>
      <div className="code">
        {selectedCountry.value && selectedCountry.value}
      </div>
    </DropdownTriggerIconWrapper>
  );
  return (
    <Dropdown
      containerClassName="country-type-filter"
      dropdownHeight="195px"
      dropdownTriggerIcon={dropdownTriggerIcon}
      enableSearch
      onSelect={props.onCountryCodeChange}
      optionWidth="260px"
      options={props.options}
      searchPlaceholder="Search by code or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
