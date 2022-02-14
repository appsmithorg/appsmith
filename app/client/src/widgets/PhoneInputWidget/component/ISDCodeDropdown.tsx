import React from "react";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import { countryToFlag } from "./utilities";
import { ISDCodeOptions, ISDCodeProps } from "constants/ISDCodes_v2";
import { Colors } from "constants/Colors";

type DropdownTriggerIconWrapperProp = {
  allowDialCodeChange: boolean;
  disabled?: boolean;
};

const DropdownTriggerIconWrapper = styled.div<DropdownTriggerIconWrapperProp>`
  padding: 7px;
  ${(props) => {
    if (props.allowDialCodeChange) {
      return `
        width: 92px;
        min-width: 92px;
      `;
    } else {
      return `
        width: 84px;
        width: 84px;
      `;
    }
  }}
  display: flex;
  align-items: center;
  font-size: 14px;
  height: 36px;
  line-height: ${(props) => (props.disabled ? 36 : 18)}px;
  letter-spacing: -0.24px;
  color: #090707;
  position: ${(props) => props.disabled && "absolute"};
  z-index: 2;
  pointer-events: ${(props) => !props.allowDialCodeChange && "none"};

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

const FlagWrapper = styled.span`
  font-size: 20px;
  line-height: 19px;
`;

const Code = styled.span`
  margin-left: 5px;
  width: calc(100% - 40px);
`;

const StyledIcon = styled(Icon)`
  margin-left: 2px;
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
}

export default function ISDCodeDropdown(props: ISDCodeDropdownProps) {
  const selectedCountry = getSelectedISDCode(props.selected.value);
  const dropdownTrigger = (
    <DropdownTriggerIconWrapper
      allowDialCodeChange={props.allowDialCodeChange}
      className={`t--input-country-code-change ${
        !props.allowDialCodeChange ? "country-type-trigger" : ""
      }`}
      disabled={props.disabled}
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
      searchPlaceholder="Search by ISD code or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}
