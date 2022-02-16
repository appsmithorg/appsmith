import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { Colors } from "constants/Colors";

const DropdownContainer = styled.div`
  .currency-type-filter,
  .currency-type-trigger {
    position: static;
    background: rgb(255, 255, 255);
    border-width: 1.2px 0px 1.2px 1.2px;
    border-top-style: solid;
    border-bottom-style: solid;
    border-left-style: solid;
    border-top-color: rgb(235, 235, 235);
    border-bottom-color: rgb(235, 235, 235);
    border-left-color: rgb(235, 235, 235);
    border-image: initial;
    color: rgb(9, 7, 7);
    border-right-style: initial;
    border-right-color: initial;
  }

  &&&&& + input {
    padding-left: 10px;
  }
`;

const DropdownTriggerIconWrapper = styled.div`
  height: 19px;
  padding: 9px 5px 9px 12px;
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

  &&& .dropdown {
    svg {
      width: 14px;
      height: 14px;

      path {
        fill: ${Colors.GREY_10};
      }
    }
  }
`;

const CurrencyIconWrapper = styled.span`
  position: static;
  background: rgb(255, 255, 255);
  border-width: 1.2px 0px 1.2px 1.2px;
  border-top-style: solid;
  border-bottom-style: solid;
  border-left-style: solid;
  border-top-color: rgb(235, 235, 235);
  border-bottom-color: rgb(235, 235, 235);
  border-left-color: rgb(235, 235, 235);
  border-image: initial;
  color: rgb(9, 7, 7);
  border-right-style: initial;
  border-right-color: initial;
  padding: 6px 12px 0px 12px;

  &&&&& + input {
    padding-left: 10px;
  }
`;

const getCurrencyOptions = (): Array<DropdownOption> => {
  return CurrencyTypeOptions.map((item: CurrencyOptionProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.label,
      label: `${item.currency} - ${item.currency_name}`,
      value: item.currency,
      id: item.symbol_native,
    };
  });
};

export const CurrencyDropdownOptions = getCurrencyOptions();

export const getDefaultCurrency = () => {
  return {
    code: "US",
    currency: "USD",
    currency_name: "US Dollar",
    label: "United States",
    phone: "1",
    symbol_native: "$",
  };
};

export const getSelectedCurrency = (currencyCode?: string): DropdownOption => {
  let selectedCurrency: CurrencyOptionProps | undefined = currencyCode
    ? CurrencyTypeOptions.find((item: CurrencyOptionProps) => {
        return item.currency === currencyCode;
      })
    : undefined;
  if (!selectedCurrency) {
    selectedCurrency = getDefaultCurrency();
  }
  return {
    label: `${selectedCurrency.currency} - ${selectedCurrency.currency_name}`,
    searchText: selectedCurrency.label,
    value: selectedCurrency.currency,
    id: selectedCurrency.symbol_native,
  };
};

export const getCountryCodeFromCurrencyCode = (currencyCode?: string) => {
  const option = CurrencyTypeOptions.find(
    (option) => option.currency === currencyCode,
  );

  if (option) {
    return option.code;
  } else {
    return "";
  }
};

interface CurrencyDropdownProps {
  onCurrencyTypeChange: (currencyCountryCode?: string) => void;
  options: Array<DropdownOption>;
  selected?: string;
  allowCurrencyChange?: boolean;
}

export default function CurrencyTypeDropdown(props: CurrencyDropdownProps) {
  const selectedOption = getSelectedCurrency(props.selected);
  const selectedCurrency = selectedOption.id;
  if (!props.allowCurrencyChange) {
    return (
      <CurrencyIconWrapper className="currency-type-trigger">
        {selectedCurrency}
      </CurrencyIconWrapper>
    );
  }
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-currency-change">
      {selectedCurrency}
      <Icon className="dropdown" name="downArrow" size={IconSize.XXS} />
    </DropdownTriggerIconWrapper>
  );
  return (
    <DropdownContainer>
      <Dropdown
        closeOnSpace={false}
        containerClassName="currency-type-filter"
        dropdownHeight="139px"
        dropdownTriggerIcon={dropdownTriggerIcon}
        enableSearch
        height="36px"
        onSelect={props.onCurrencyTypeChange}
        optionWidth="340px"
        options={props.options}
        searchPlaceholder="Search by currency or country"
        selected={selectedOption}
        showLabelOnly
      />
    </DropdownContainer>
  );
}
