import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";

const DropdownTriggerIconWrapper = styled.div`
  height: 19px;
  padding: 9px 5px 9px 12px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.24px;
  color: #090707;
  > * {
    margin-left: 5px;
  }
`;

const CurrencyIconWrapper = styled.span`
  height: 100%;
  padding: 6px 4px 6px 12px;
  position: absolute;
  left: 0;
  z-index: 16;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.24px;
  color: #090707;
`;

const getCurrencyOptions = (): Array<DropdownOption> => {
  return CurrencyTypeOptions.map((item: CurrencyOptionProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.label,
      label: `${item.currency} - ${item.currency_name}`,
      value: item.code,
      id: item.symbol_native,
    };
  });
};

export const CurrencyDropdownOptions = getCurrencyOptions();

export const getSelectedCurrency = (
  currencyCountryCode?: string,
): DropdownOption => {
  let selectedCurrency: CurrencyOptionProps | undefined = currencyCountryCode
    ? CurrencyTypeOptions.find((item: CurrencyOptionProps) => {
        return item.code === currencyCountryCode;
      })
    : undefined;
  if (!selectedCurrency) {
    selectedCurrency = {
      code: "US",
      currency: "USD",
      currency_name: "US Dollar",
      label: "United States",
      phone: "1",
      symbol_native: "$",
    };
  }
  return {
    label: `${selectedCurrency.currency} - ${selectedCurrency.currency_name}`,
    searchText: selectedCurrency.label,
    value: selectedCurrency.code,
    id: selectedCurrency.symbol_native,
  };
};

interface CurrencyDropdownProps {
  onCurrencyTypeChange: (currencyCountryCode?: string) => void;
  options: Array<DropdownOption>;
  selected: DropdownOption;
  allowCurrencyChange?: boolean;
}

export default function CurrencyTypeDropdown(props: CurrencyDropdownProps) {
  const selectedCurrency = getSelectedCurrency(props.selected.value).id;
  if (!props.allowCurrencyChange) {
    return <CurrencyIconWrapper>{selectedCurrency}</CurrencyIconWrapper>;
  }
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-currency-change">
      {selectedCurrency}
      <Icon name="downArrow" size={IconSize.XXS} />
    </DropdownTriggerIconWrapper>
  );
  return (
    <Dropdown
      containerClassName="currency-type-filter"
      dropdownHeight="195px"
      dropdownTriggerIcon={dropdownTriggerIcon}
      enableSearch
      height="32px"
      onSelect={props.onCurrencyTypeChange}
      optionWidth="260px"
      options={props.options}
      searchPlaceholder="Search by currency or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
