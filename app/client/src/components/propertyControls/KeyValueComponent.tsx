import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { FormIcons } from "icons/FormIcons";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";
import type { DropDownOptionWithKey } from "./OptionControl";
import type { DropdownOption } from "components/constants";
import { generateReactKey } from "utils/generators";
import { Category, Size } from "design-system-old";
import { debounce } from "lodash";
import { getNextEntityName } from "utils/AppsmithUtils";

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

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON)`
  cursor: pointer;

  && svg path {
    fill: ${(props) => props.theme.colors.propertyPane.deleteIconColor};
  }

  &&:hover {
    svg path {
      fill: ${(props) => props.theme.colors.propertyPane.title};
    }
  }
`;

const StyledBox = styled.div`
  width: 10px;
`;

const StyledButton = styled.button`
  width: 28px;
  height: 28px;

  &&& svg {
    width: 14px;
    height: 14px;
  }

  &&:focus {
    svg path {
      fill: ${(props) => props.theme.colors.propertyPane.title};
    }
  }
`;

type UpdatePairFunction = (
  pair: DropdownOption[],
  isUpdatedViaKeyboard?: boolean,
) => any;

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

  function deletePair(index: number, isUpdatedViaKeyboard = false) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];

    const newPairs = pairs.filter((o, i) => i !== index);
    const newRenderPairs = renderPairs.filter((o, i) => i !== index);

    setRenderPairs(newRenderPairs);
    props.updatePairs(newPairs, isUpdatedViaKeyboard);
  }

  const debouncedUpdatePairs = useCallback(
    debounce((updatedPairs: DropdownOption[]) => {
      props.updatePairs(updatedPairs, true);
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

  function addPair(e: React.MouseEvent) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];
    pairs.push({
      label: getNextEntityName(
        "Option",
        pairs.map((pair: any) => pair.label),
      ),
      value: getNextEntityName(
        "OPTION",
        pairs.map((pair: any) => pair.value),
      ),
    });
    const updatedRenderPairs = renderPairs.slice();
    updatedRenderPairs.push({
      label: getNextEntityName(
        "Option",
        renderPairs.map((pair: any) => pair.label),
      ),
      value: getNextEntityName(
        "OPTION",
        renderPairs.map((pair: any) => pair.value),
      ),
      key: getNextEntityName(
        "OPTION",
        renderPairs.map((pair: any) => pair.value),
      ),
    });

    setRenderPairs(updatedRenderPairs);
    props.updatePairs(pairs, e.detail === 0);
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
          <ControlWrapper key={pair.key} orientation={"HORIZONTAL"}>
            <StyledInputGroup
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
            <StyledBox />
            <StyledButton
              onClick={(e: React.MouseEvent) => {
                deletePair(index, e.detail === 0);
              }}
            >
              <StyledDeleteIcon />
            </StyledButton>
          </ControlWrapper>
        );
      })}

      <StyledPropertyPaneButton
        category={Category.secondary}
        className="t--property-control-options-add"
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
