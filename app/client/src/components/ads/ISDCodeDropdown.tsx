import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "components/designSystems/blueprint/InputComponent/utilties";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes";

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
  if (props.disabled) {
    return (
      <DropdownTriggerIconWrapper>{selectedCountry}</DropdownTriggerIconWrapper>
    );
  }
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-country-code-change">
      <div className="icon-dropdown">
        {selectedCountry.value && countryToFlag(selectedCountry.value)}
        <Icon name="downArrow" size={IconSize.XXS} />
      </div>
      <div className="code">{selectedCountry.id && selectedCountry.id}</div>
    </DropdownTriggerIconWrapper>
  );
  return (
    <Dropdown
      containerClassName="country-type-filter"
      dropdownHeight="195px"
      dropdownTriggerIcon={dropdownTriggerIcon}
      enableSearch
      onSelect={props.onISDCodeChange}
      optionWidth="260px"
      options={props.options}
      searchPlaceholder="Search by ISD code or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
