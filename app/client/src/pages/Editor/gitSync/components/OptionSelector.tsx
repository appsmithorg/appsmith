import React from "react";
import Dropdown, {
  DefaultDropDownValueNodeProps,
  DropdownWrapper,
  DropdownContainer as DropdownComponentContainer,
} from "components/ads/Dropdown";
import { ReactComponent as ChevronDown } from "assets/icons/ads/chevron-down.svg";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { DropdownOption } from "components/ads/Dropdown";
import { Classes as GitSyncClasses } from "pages/Editor/gitSync/constants";

const SelectedValueNodeContainer = styled.div`
  color: ${Colors.CRUSTA};
  display: flex;
  align-items: center;
  & .label {
    margin-right: ${(props) => props.theme.spaces[2]}px;
  }
`;

function SelectedValueNode(props: DefaultDropDownValueNodeProps) {
  const { selected } = props;
  return (
    <SelectedValueNodeContainer>
      <span className="label">{(selected as DropdownOption).label}</span>
      <ChevronDown />
    </SelectedValueNodeContainer>
  );
}

const DropdownContainer = styled.div`
  & ${DropdownComponentContainer} {
    width: max-content;
  }
  &&&& ${DropdownWrapper} {
    padding: 0;
  }
`;

type OptionSelectorProps = {
  options: DropdownOption[];
  selected: DropdownOption;
  onSelect?: (value?: string, dropdownOption?: any) => void;
};

function OptionSelector({ onSelect, options, selected }: OptionSelectorProps) {
  return (
    <DropdownContainer className={GitSyncClasses.OPTION_SELECTOR_WRAPPER}>
      <Dropdown
        SelectedValueNode={SelectedValueNode}
        bgColor={"transparent"}
        className="auth-type-dropdown"
        onSelect={onSelect}
        options={options}
        selected={selected}
        showDropIcon={false}
        showLabelOnly
      />
    </DropdownContainer>
  );
}

export default OptionSelector;
