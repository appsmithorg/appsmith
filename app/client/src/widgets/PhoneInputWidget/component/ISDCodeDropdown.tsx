import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes_v2";
import { Colors } from "constants/Colors";
import { Classes } from "@blueprintjs/core";
import { lightenColor } from "widgets/WidgetUtils";

type DropdownTriggerIconWrapperProp = {
  allowDialCodeChange: boolean;
  disabled?: boolean;
};

const DropdownTriggerIconWrapper = styled.button<
  DropdownTriggerIconWrapperProp
>`
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
  z-index: 2;
  pointer-events: ${(props) => !props.allowDialCodeChange && "none"};
  ${(props) => (props.disabled ? `background-color: ${Colors.GREY_1};` : "")};
  border-right: 1px solid ${Colors.GREY_3};
  gap: 0.25rem;
  padding: 0 0.75rem;
  margin-right: 0.625rem;

  &:focus {
    background-color: ${Colors.GREY_1};
  }

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

const Code = styled.span``;

const StyledIcon = styled(Icon)`
  margin-left: 2px;
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
      box-shadow: 0px 0px 0px 3px ${lightenColor(props.accentColor)} !important;
      border: 1px solid ${props.accentColor} !important;
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
      leftElement: countryToFlag(item.dial_code),
      searchText: item.name,
      label: `${item.name} (${item.dial_code})`,
      value: item.dial_code,
      id: item.dial_code,
    };
  });
};

export const ISDCodeDropdownOptions = getISDCodeOptions();

export const getDefaultISDCode = () => ({
  name: "United States",
  dial_code: "+1",
  code: "US",
});

export const getSelectedISDCode = (dialCode?: string): DropdownOption => {
  let selectedCountry: ISDCodeProps | undefined = ISDCodeOptions.find(
    (item: ISDCodeProps) => item.dial_code === dialCode,
  );
  if (!selectedCountry) {
    selectedCountry = getDefaultISDCode();
  }
  return {
    label: `${selectedCountry.name} (${selectedCountry.dial_code})`,
    searchText: selectedCountry.name,
    value: selectedCountry.dial_code,
    id: selectedCountry.dial_code,
  };
};

export const getCountryCode = (dialCode?: string) => {
  const option = ISDCodeOptions.find((item: ISDCodeProps) => {
    return item.dial_code === dialCode;
  });

  if (option) {
    return option.code;
  } else {
    return "";
  }
};

interface ISDCodeDropdownProps {
  onISDCodeChange: (code?: string) => void;
  options: Array<DropdownOption>;
  selected: DropdownOption;
  allowCountryCodeChange?: boolean;
  disabled: boolean;
  allowDialCodeChange: boolean;
  widgetId: string;
  borderRadius?: string;
  accentColor?: string;
}

export default function ISDCodeDropdown(props: ISDCodeDropdownProps) {
  const selectedCountry = getSelectedISDCode(props.selected.value);
  const dropdownTrigger = (
    <DropdownTriggerIconWrapper
      allowDialCodeChange={props.allowDialCodeChange}
      className={`t--input-country-code-change isd-change-dropdown-trigger ${
        !props.allowDialCodeChange ? "country-type-trigger" : ""
      }`}
      disabled={props.disabled}
      tabIndex={0}
      type="button"
    >
      <FlagWrapper>
        {selectedCountry.value && countryToFlag(selectedCountry.value)}
      </FlagWrapper>
      <Code>{selectedCountry.id && selectedCountry.id}</Code>
      {props.allowDialCodeChange && (
        <StyledIcon
          className="dropdown"
          name="down-arrow"
          size={IconSize.XXS}
        />
      )}
    </DropdownTriggerIconWrapper>
  );
  if (props.disabled || !props.allowDialCodeChange) {
    return dropdownTrigger;
  }
  return (
    <>
      <Dropdown
        closeOnSpace={false}
        containerClassName="country-type-filter"
        dropdownHeight="139px"
        dropdownTriggerIcon={dropdownTrigger}
        enableSearch
        height="36px"
        onSelect={props.onISDCodeChange}
        optionWidth="340px"
        options={props.options}
        portalClassName={`country-type-filter-dropdown-${props.widgetId}`}
        searchAutoFocus
        searchPlaceholder="Search by ISD code or country"
        selected={props.selected}
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
