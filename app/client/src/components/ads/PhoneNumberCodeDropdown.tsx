import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "components/designSystems/blueprint/InputComponent/utilties";

const DropdownTriggerIconWrapper = styled.div`
  height: 19px;
  padding: 9px 5px 9px 12px;
  width: 40px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  color: #090707;
`;

export const getPhoneNumberCodeOptions = (): Array<DropdownOption> => {
  return CurrencyTypeOptions.map((item: CurrencyOptionProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.label,
      label: `${item.label} (${item.country_code})`,
      value: item.country_code,
    };
  });
};

export const getSelectedCountryCode = (
  countryCode?: string,
): DropdownOption => {
  const selectedCountryCode: CurrencyOptionProps | undefined = countryCode
    ? CurrencyTypeOptions.find((item: CurrencyOptionProps) => {
        return item.country_code === countryCode;
      })
    : undefined;
  if (selectedCountryCode) {
    return {
      label: `${
        selectedCountryCode.label
      } (${selectedCountryCode.country_code || "+91"})`,
      searchText: selectedCountryCode.label,
      value: selectedCountryCode.country_code,
      id: selectedCountryCode.code,
    };
  }
  return CurrencyTypeOptions[0];
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
  const selectedCountryCode = getSelectedCountryCode(props.selected.value);
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-country-code-change">
      {countryToFlag(selectedCountryCode.id || "AD")}
      <Icon name="downArrow" size={IconSize.XXS} />
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
