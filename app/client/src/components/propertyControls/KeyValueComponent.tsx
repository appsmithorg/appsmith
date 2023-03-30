import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { ControlWrapper } from "./StyledControls";
import type { TextInputProps } from "design-system-old";
import { Button, Input } from "design-system";
import type { DropDownOptionWithKey } from "./OptionControl";
import type { DropdownOption } from "components/constants";
import { generateReactKey } from "utils/generators";
import { debounce } from "lodash";
import { getNextEntityName } from "utils/AppsmithUtils";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";

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

const StyledBox = styled.div`
  width: 10px;
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

  function deletePair(index: number, isUpdatedViaKeyboard = false) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];

    const newPairs = pairs.filter((o, i) => i !== index);
    const newRenderPairs = renderPairs.filter((o, i) => i !== index);

    setRenderPairs(newRenderPairs);
    props.updatePairs(newPairs, isUpdatedViaKeyboard);
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
            <Button
              isIconButton
              kind="tertiary"
              onClick={(e: React.MouseEvent) => {
                deletePair(index, e.detail === 0);
              }}
              size="sm"
              startIcon="delete-bin-line"
              style={{ width: "50px" }}
            />
          </ControlWrapper>
        );
      })}

      <div className="flex flex-row-reverse">
        <Button
          className="t--property-control-options-add"
          kind="secondary"
          onClick={addPair}
          size="md"
          startIcon="plus"
        >
          {props.addLabel || "Option"}
        </Button>
      </div>
    </>
  );
}

const InputGroup = styled(Input)`
  > .ads-v2-input__input-section > div {
    min-width: 0px;
  }
`;

const StyledInputGroup = React.forwardRef((props: TextInputProps, ref) => {
  let inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLInputElement>(null);
  const { dispatchInteractionAnalyticsEvent } =
    useInteractionAnalyticsEvent<HTMLInputElement>(false, wrapperRef);

  if (ref) inputRef = ref as React.RefObject<HTMLInputElement>;

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
          dispatchInteractionAnalyticsEvent({ key: e.key });
          inputRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Escape":
        if (document.activeElement === inputRef?.current) {
          dispatchInteractionAnalyticsEvent({ key: e.key });
          wrapperRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Tab":
        if (document.activeElement === wrapperRef?.current) {
          dispatchInteractionAnalyticsEvent({
            key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
          });
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} tabIndex={0}>
      <InputGroup ref={inputRef} {...props} size="md" tabIndex={-1} />
    </div>
  );
});

StyledInputGroup.displayName = "StyledInputGroup";
