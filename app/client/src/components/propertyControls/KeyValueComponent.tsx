import React, { useState, useEffect } from "react";

import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";

import { DropDownOptionWithKey } from "./OptionControl";
import { DropdownOption } from "widgets/DropdownWidget";
import { generateReactKey } from "utils/generators";

function updateOptionLabel<T>(
  options: Array<T>,
  index: number,
  updatedLabel: string,
) {
  return options.map((option: T, optionIndex) => {
    if (index !== optionIndex) {
      return option;
    }
    return {
      ...option,
      label: updatedLabel,
    };
  });
}

function updateOptionValue<T>(
  options: Array<T>,
  index: number,
  updatedValue: string,
) {
  return options.map((option, optionIndex) => {
    if (index !== optionIndex) {
      return option;
    }
    return {
      ...option,
      value: updatedValue,
    };
  });
}

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 0px 5px;
  position: absolute;
  right: 8px;
  cursor: pointer;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
`;

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding-right: 16px;
  width: calc(100% - 10px);
`;

type KeyValueComponentProps = {
  pairs: DropdownOption[];
  updatePairs: Function;
  addLabel?: string;
};
export function KeyValueComponent(props: KeyValueComponentProps) {
  const [renderPairs, setRenderPairs] = useState<DropDownOptionWithKey[]>([]);
  const { pairs } = props;
  useEffect(() => {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];

    const newRenderPairs: DropDownOptionWithKey[] = pairs.map(pair => {
      return {
        ...pair,
        key: generateReactKey(),
      };
    });

    pairs.length !== 0 &&
      renderPairs.length === 0 &&
      setRenderPairs(newRenderPairs);
  }, [props, pairs.length, renderPairs.length]);

  function deletePair(index: number) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];

    const newPairs = pairs.filter((o, i) => i !== index);
    const newRenderPairs = renderPairs.filter((o, i) => i !== index);

    setRenderPairs(newRenderPairs);
    props.updatePairs(newPairs);
  }

  function updateKey(index: number, updatedKey: string) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];
    const updatedPairs = updateOptionLabel(pairs, index, updatedKey);
    const updatedRenderPairs = updateOptionLabel(
      renderPairs,
      index,
      updatedKey,
    );

    setRenderPairs(updatedRenderPairs);
    props.updatePairs(updatedPairs);
  }

  function updateValue(index: number, updatedValue: string) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];
    const updatedPairs = updateOptionValue(pairs, index, updatedValue);
    const updatedRenderPairs = updateOptionValue(
      renderPairs,
      index,
      updatedValue,
    );

    setRenderPairs(updatedRenderPairs);
    props.updatePairs(updatedPairs);
  }

  function addPair() {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];
    pairs.push({ label: "", value: "" });
    const updatedRenderPairs = renderPairs.slice();
    updatedRenderPairs.push({ label: "", value: "", key: generateReactKey() });

    setRenderPairs(updatedRenderPairs);
    props.updatePairs(pairs);
  }

  return (
    <React.Fragment>
      {renderPairs.map((pair: DropDownOptionWithKey, index) => {
        return (
          <StyledOptionControlWrapper orientation={"HORIZONTAL"} key={pair.key}>
            <StyledOptionControlInputGroup
              type={"text"}
              placeholder={"Name"}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                updateKey(index, event.target.value);
              }}
              defaultValue={pair.label}
            />
            <StyledOptionControlInputGroup
              type={"text"}
              placeholder={"Value"}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                updateValue(index, event.target.value);
              }}
              defaultValue={pair.value}
            />
            <StyledDeleteIcon
              height={20}
              width={20}
              onClick={() => {
                deletePair(index);
              }}
            />
          </StyledOptionControlWrapper>
        );
      })}
      <StyledPropertyPaneButton
        text={props.addLabel || "Option"}
        icon={"plus"}
        color={"#FFFFFF"}
        minimal={true}
        onClick={addPair}
      />
    </React.Fragment>
  );
}
