import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes";
import { Colors } from "constants/Colors";
import { Classes } from "@blueprintjs/core";
import { lightenColor } from "widgets/WidgetUtils";

const DropdownTriggerIconWrapper = styled.div<{ disabled?: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: ${(props) => (props.disabled ? 36 : 18)}px;
  letter-spacing: -0.24px;
  color: #090707;
  cursor: pointer;
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

export const PopoverStyles = createGlobalStyle<{
  borderRadius: string;
  portalClassName: string;
  accentColor: string;
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
      min-height: 32px;
    }

    .${props.portalClassName}  .${Classes.INPUT}:focus, .${
    props.portalClassName
  }  .${Classes.INPUT}:active {
      border: 1px solid ${props.accentColor} !important;
      box-shadow:  0px 0px 0px 3px ${lightenColor(
        props.accentColor,
      )} !important;
    }

    .${props.portalClassName} .t--dropdown-option:hover,
    .${props.portalClassName} .t--dropdown-option.selected {
      background-color: ${lightenColor(props.accentColor)} !important;
    }

    .${props.portalClassName} .ads-dropdown-options-wrapper {
      border: 0px solid !important;
    }
  `}
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
  borderRadius: string;
  accentColor: string;
  widgetId: string;
}

export default function ISDCodeDropdown(props: ISDCodeDropdownProps) {
  const selectedCountry = getSelectedISDCode(props.selected.value);
  const dropdownTrigger = (
    <DropdownTriggerIconWrapper
      className="gap-2 px-3 t--input-country-code-change focus:bg-gray-50"
      disabled={props.disabled}
      tabIndex={0}
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
    <>
      <Dropdown
        containerClassName="country-type-filter"
        dropdownHeight="139px"
        dropdownTriggerIcon={dropdownTrigger}
        enableSearch
        height="36px"
        onSelect={props.onISDCodeChange}
        optionWidth="340px"
        options={props.options}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
        searchPlaceholder="Search by ISD code or country"
        selected={props.selected}
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
