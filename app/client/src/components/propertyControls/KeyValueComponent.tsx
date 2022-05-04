import React, {
  useState,
  useEffect,
  useCallback,
  EventHandler,
  FocusEvent,
  useRef,
} from "react";

import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";
import { InputWrapper } from "components/ads/TextInput";
import { DropDownOptionWithKey } from "./OptionControl";
import { DropdownOption } from "components/constants";
import { generateReactKey } from "utils/generators";
import { Category, Size } from "components/ads/Button";
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

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
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
          <ControlWrapper key={pair.key} orientation={"HORIZONTAL"}>
            <InputGroupWithMultiState
              onBlur={onInputBlur}
              onChange={(value: string) => {
                updateKey(index, value);
              }}
              onFocus={onInputFocus}
              placeholder={"Name"}
              value={pair.label}
            />
            <StyledBox />
            <InputGroupWithMultiState
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
              onClick={() => {
                deletePair(index);
              }}
            >
              <StyledDeleteIcon />
            </StyledButton>
          </ControlWrapper>
        );
      })}

      <StyledPropertyPaneButton
        category={Category.tertiary}
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

const StyledInputWrapper = styled.div`
  &:focus ${InputWrapper} {
    border: 1.2px solid var(--appsmith-input-focus-border-color);
  }
`;

type InputGroupWithMultiStateProps = {
  onBlur?: EventHandler<FocusEvent<any>>;
  onChange?: (value: string) => void;
  onFocus?: EventHandler<FocusEvent<any>>;
  placeholder?: string;
  value: string;
};

function InputGroupWithMultiState(props: InputGroupWithMultiStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === wrapperRef?.current) {
          inputRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Escape":
        if (document.activeElement === inputRef?.current) {
          wrapperRef?.current?.focus();
          e.preventDefault();
        }
        break;
    }
  };

  return (
    <StyledInputWrapper ref={wrapperRef} tabIndex={0}>
      <StyledInputGroup
        dataType={"text"}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
        placeholder={props.placeholder}
        ref={inputRef}
        tabIndex={-1}
        value={props.value}
        width="auto"
      />
    </StyledInputWrapper>
  );
}
