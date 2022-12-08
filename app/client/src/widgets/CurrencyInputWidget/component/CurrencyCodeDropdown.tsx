import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import { Dropdown, DropdownOption, Icon, IconSize } from "design-system";
import { Classes } from "@blueprintjs/core";
import { countryToFlag } from "./utilities";
import { Colors } from "constants/Colors";
import { lightenColor } from "widgets/WidgetUtils";

const StyledDropdown = styled(Dropdown)`
  /*
    We use this font family to show emoji flags
    on windows devices
  */
  .left-icon-wrapper {
    font-family: "Twemoji Country Flags";
  }
`;

const DropdownTriggerIconWrapper = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: normal;
  letter-spacing: -0.24px;
  color: var(--wds-color-text);
  border-right: 1px solid var(--wds-color-border);
  gap: 0.25rem;
  padding: 0 0.75rem;
  height: 100%;
  margin-right: 0.625rem;

  &:disabled {
    color: var(--wds-color-text-disabled);

    .dropdown {
      background: var(--wds-color-bg-disabled);

      svg {
        path {
          fill: var(--wds-color-icon-disabled) !important;
        }
      }
    }
  }

  &:focus {
    background-color: ${Colors.GREY_1};

    .dropdown {
      background: ${Colors.GREY_1};
    }
  }

  .dropdown {
    svg {
      width: 16px;
      height: 16px;

      path {
        fill: var(--wds-color-icon) !important;
      }
    }
  }

  &:disabled {
    border-right: 1px solid var(--wds-color-border-disabled);
    background-color: var(--wds-color-bg-disabled);
  }
`;

export const PopoverStyles = createGlobalStyle<{
  borderRadius?: string;
  portalClassName: string;
  accentColor?: string;
}>`
  ${(props) => `
    .${props.portalClassName} .${Classes.POPOVER} {
      border-radius: ${
        props.borderRadius === "1.5rem" ? `0.375rem` : props.borderRadius
      } !important;
      overflow: hidden;
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
      margin-top: 4px !important;
    }

    .${props.portalClassName} .${Classes.BUTTON} {
      border-radius: ${
        props.borderRadius === "1.5rem" ? `0.375rem` : props.borderRadius
      } !important;
    }

    .${props.portalClassName}  .${Classes.INPUT} {
      border-radius: ${
        props.borderRadius === "1.5rem" ? `0.375rem` : props.borderRadius
      } !important;
    }

    .${props.portalClassName}  .${Classes.INPUT}:focus, .${
    props.portalClassName
  }  .${Classes.INPUT}:active {
      border: 1px solid ${props.accentColor} !important;
      box-shadow: 0px 0px 0px 2px ${lightenColor(props.accentColor)} !important;
    }

    .${props.portalClassName} .t--dropdown-option:hover {
      background-color: var(--wds-color-bg-hover) !important;
    }

    .${props.portalClassName} .t--dropdown-option.selected {
      background-color: ${lightenColor(props.accentColor)} !important;
    }

    .${props.portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
      box-shadow: none !important;
    }

    .${props.portalClassName} .dropdown-search {
      margin: 10px !important;
      width: calc(100% - 20px);

      input {
        border: 1px solid var(--wds-color-border);
        padding-left: 36px !important;
        padding-right: 10px !important;
      }

      .bp3-icon-search {
        left: 4px;
        right: auto;
      }

      .bp3-input-group + div {
        display: flex;
        height: 100%;
        top: 0;
        right: 7px;
        bottom: 0;
        align-items: center;

        svg {
          position: relative;
          top: 0;
        }
      }

      input:hover {
        background: white;
        border: 1px solid var(--wds-color-border-hover);
      }
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
  accentColor?: string;
  borderRadius?: string;
  widgetId: string;
  isDisabled?: boolean;
}

export default function CurrencyTypeDropdown(props: CurrencyDropdownProps) {
  const selectedOption = getSelectedCurrency(props.selected);
  const selectedCurrency = selectedOption.id;
  const dropdownTrigger = (
    <DropdownTriggerIconWrapper
      className="t--input-currency-change currency-change-dropdown-trigger"
      disabled={props.isDisabled}
      tabIndex={0}
      type="button"
    >
      {selectedCurrency}
      {props.allowCurrencyChange && (
        <Icon className="dropdown" name="down-arrow" size={IconSize.XXS} />
      )}
    </DropdownTriggerIconWrapper>
  );

  if (!props.allowCurrencyChange) {
    return dropdownTrigger;
  }

  return (
    <>
      <StyledDropdown
        closeOnSpace={false}
        containerClassName="currency-type-filter"
        dropdownHeight="139px"
        dropdownTriggerIcon={dropdownTrigger}
        enableSearch
        height="36px"
        onSelect={props.onCurrencyTypeChange}
        optionWidth="340px"
        options={props.options}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
        portalContainer={document.getElementById("art-board") || undefined}
        searchAutoFocus
        searchPlaceholder="Search by currency or country"
        selected={selectedOption}
        showEmptyOptions
        showLabelOnly
      />
      <PopoverStyles
        accentColor={props.accentColor}
        borderRadius={props.borderRadius}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
      />
    </>
  );
}
