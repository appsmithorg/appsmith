import React from "react";
import Dropdown, {
  DefaultDropDownValueNodeProps,
  DropdownWrapper,
  DropdownContainer as DropdownComponentContainer,
} from "components/ads/Dropdown";
import { ReactComponent as ChevronDown } from "assets/icons/ads/chevron-down.svg";
import { Colors } from "constants/Colors";
import styled from "styled-components";

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
      <span className="label">{selected.label}</span>
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

function SelectAuthType() {
  return (
    <DropdownContainer>
      <Dropdown
        SelectedValueNode={SelectedValueNode}
        bgColor={"transparent"}
        className="auth-type-dropdown"
        options={[
          { label: "SSH", value: "SSh" },
          { label: "HTTPS", value: "HTTPS" },
        ]}
        // renderOption={({ option }: any) => <div>{option.label}</div>}
        selected={{ label: "SSH", value: "SSh" }}
        showDropIcon={false}
        showLabelOnly
      />
    </DropdownContainer>
  );
}

export default SelectAuthType;
