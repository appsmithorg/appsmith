import React, { useState, useEffect, useCallback } from "react";

import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";

import { DropDownOptionWithKey } from "./OptionControl";
import { DropdownOption } from "components/constants";
import { generateReactKey } from "utils/generators";
import { Category, Size } from "components/ads/Button";
import { debounce } from "lodash";

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
  right: 4px;
  cursor: pointer;
  && svg path {
    fill: ${(props) => props.theme.colors.propertyPane.deleteIconColor};
  }
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 5px;
`;

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding-right: 16px;
  width: calc(100% - 10px);
`;

const StyledBox = styled.div`
  width: 10px;
`;

type UpdatePairFunction = (pair: DropdownOption[]) => any;

type KeyValueComponentProps = {
  pairs: DropdownOption[];
  updatePairs: UpdatePairFunction;
  addLabel?: string;
};
export function KeyValueComponent(props: KeyValueComponentProps) {
  const [renderPairs, setRenderPairs] = useState<DropDownOptionWithKey[]>([]);
  const [typing, setTyping] = useState<boolean>(false);
  const { pairs } = props;
  useEffect(() => {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];

    const newRenderPairs: DropDownOptionWithKey[] = pairs.map((pair) => {
      return {
        ...pair,
        key: generateReactKey(),
      };
    });

    pairs.length !== 0 && !typing && setRenderPairs(newRenderPairs);
  }, [props, pairs.length, renderPairs.length]);

  function deletePair(index: number) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];

    const newPairs = pairs.filter((o, i) => i !== index);
    const newRenderPairs = renderPairs.filter((o, i) => i !== index);

    setRenderPairs(newRenderPairs);
    props.updatePairs(newPairs);
  }

  const debouncedUpdatePairs = useCallback(
    debounce((updatedPairs: DropdownOption[]) => {
      props.updatePairs(updatedPairs);
    }, 200),
    [props.updatePairs],
  );

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
    debouncedUpdatePairs(updatedPairs);
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
    debouncedUpdatePairs(updatedPairs);
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

  function onInputFocus() {
    setTyping(true);
  }

  function onInputBlur() {
    setTyping(false);
  }

  return (
    <>
      {renderPairs.map((pair: DropDownOptionWithKey, index) => {
        return (
          <StyledOptionControlWrapper key={pair.key} orientation={"HORIZONTAL"}>
            <StyledOptionControlInputGroup
              dataType={"text"}
              onBlur={onInputBlur}
              onChange={(value: string) => {
                updateKey(index, value);
              }}
              onFocus={onInputFocus}
              placeholder={"Name"}
              value={pair.label}
            />
            <StyledBox />
            <StyledInputGroup
              dataType={"text"}
              onBlur={onInputBlur}
              onChange={(value: string) => {
                updateValue(index, value);
              }}
              onFocus={onInputFocus}
              placeholder={"Value"}
              value={pair.value}
            />
            <StyledDeleteIcon
              height={20}
              onClick={() => {
                deletePair(index);
              }}
              width={20}
            />
          </StyledOptionControlWrapper>
        );
      })}

      <StyledPropertyPaneButton
        category={Category.tertiary}
        icon="plus"
        onClick={addPair}
        size={Size.medium}
        tag="button"
        text={props.addLabel || "Option"}
        type="button"
      />
    </>
  );
}
