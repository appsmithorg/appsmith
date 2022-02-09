import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "@blueprintjs/core";
import { countryToFlag } from "./utilities";
import { Colors } from "constants/Colors";
import { lightenColor } from "widgets/WidgetUtils";

const DropdownTriggerIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: normal;
  letter-spacing: -0.24px;
  color: #090707;

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

const CurrencyIconWrapper = styled.span`
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0px 4px 0px 12px;
  position: absolute;
  left: 0;
  z-index: 16;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.24px;
  color: #090707;
`;

export const PopoverStyles = createGlobalStyle<{
  borderRadius?: string;
  portalClassName: string;
  primaryColor?: string;
}>`
  ${(props) => `
    .${props.portalClassName} .${Classes.POPOVER} {
      border-radius: ${props.borderRadius} !important;
      overflow: hidden;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 4px !important;
    }

    .${props.portalClassName} .${Classes.BUTTON} {
      border-radius: ${props.borderRadius} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT} {
      border-radius: ${props.borderRadius} !important;
    }

    .${props.portalClassName}  .${Classes.INPUT}:focus, .${
    props.portalClassName
  }  .${Classes.INPUT}:active {
      border: 1px solid ${props.primaryColor} !important;
    }

    .${props.portalClassName} .t--dropdown-option:hover,
    .${props.portalClassName} .t--dropdown-option.selected {
      background-color: ${lightenColor(props.primaryColor)} !important;
    }

    .${props.portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
    }
  `}
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
  primaryColor?: string;
  borderRadius?: string;
  widgetId: string;
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
    <DropdownTriggerIconWrapper
      className="h-full gap-2 px-3 t--input-currency-change focus:bg-gray-50"
      tabIndex={0}
    >
      {selectedCurrency}
      <Icon className="dropdown" name="downArrow" size={IconSize.XXS} />
    </DropdownTriggerIconWrapper>
  );
  return (
    <>
      <Dropdown
        containerClassName="currency-type-filter"
        dropdownHeight="139px"
        dropdownTriggerIcon={dropdownTriggerIcon}
        enableSearch
        height="36px"
        onSelect={props.onCurrencyTypeChange}
        optionWidth="340px"
        options={props.options}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
        searchPlaceholder="Search by currency or country"
        selected={selectedOption}
        showLabelOnly
      />
      <PopoverStyles
        borderRadius={props.borderRadius}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
        primaryColor={props.primaryColor}
      />
    </>
  );
}
