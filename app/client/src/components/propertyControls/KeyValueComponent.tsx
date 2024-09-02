import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { ControlWrapper, InputGroup } from "./StyledControls";
import type { SegmentedControlOption } from "@appsmith/ads";
import { Button } from "@appsmith/ads";
import { generateReactKey } from "utils/generators";
import { debounce } from "lodash";
import { getNextEntityName } from "utils/AppsmithUtils";
import { ReactComponent as WarningErrorIcon } from "assets/icons/alert/warning-error.svg";

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
const FlexBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ErrorMessageBox = styled.div`
  color: ${(props) => props.theme.colors.error};
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  margin-bottom: 12px;
`;

const StyledBox = styled.div`
  width: 10px;
`;

const StyledInputGroup = styled(InputGroup)<{ hasError: boolean }>`
  > .ads-v2-input__input-section > div {
    min-width: 0px;
  }
  & input {
    ${(props) =>
      props.hasError &&
      `
      border-color: ${props.theme.colors.error};
    `}
    ${(props) =>
      !props.hasError &&
      `
      border-color: #cdd5df;
      &:focus {
        border-color: #4c5664;
      }
      &:hover {
        border-color: #99a4b3;
      }
    `}
  }
`;

type UpdatePairFunction = (
  pair: SegmentedControlOption[],
  isUpdatedViaKeyboard?: boolean,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any;

interface KeyValueComponentProps {
  pairs: SegmentedControlOption[];
  updatePairs: UpdatePairFunction;
  addLabel?: string;
}

type SegmentedControlOptionWithKey = SegmentedControlOption & {
  key: string;
};

export function KeyValueComponent(props: KeyValueComponentProps) {
  const [renderPairs, setRenderPairs] = useState<
    SegmentedControlOptionWithKey[]
  >([]);
  const [typing, setTyping] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const { pairs } = props;
  useEffect(() => {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];

    const newRenderPairs: SegmentedControlOptionWithKey[] = pairs.map(
      (pair) => {
        return {
          ...pair,
          key: generateReactKey(),
        };
      },
    );

    pairs.length !== 0 && !typing && setRenderPairs(newRenderPairs);
    validatePairs(newRenderPairs);
  }, [props, pairs.length, renderPairs.length]);

  const debouncedUpdatePairs = useCallback(
    debounce((updatedPairs: SegmentedControlOption[]) => {
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
    validatePairs(updatedRenderPairs);
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
    validatePairs(updatedRenderPairs);
  }

  function validatePairs(pairs: SegmentedControlOptionWithKey[]) {
    const newErrorMessages = pairs.map((pair) => {
      if (!pair.label && !pair.value) {
        return "Both Name and Value can't be empty";
      }
      return "";
    });
    setErrorMessages(newErrorMessages);
  }

  function deletePair(index: number, isUpdatedViaKeyboard = false) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs : [];

    const newPairs = pairs.filter((o, i) => i !== index);
    const newRenderPairs = renderPairs.filter((o, i) => i !== index);

    setRenderPairs(newRenderPairs);
    validatePairs(newRenderPairs);
    props.updatePairs(newPairs, isUpdatedViaKeyboard);
  }

  function addPair(e: React.MouseEvent) {
    let { pairs } = props;
    pairs = Array.isArray(pairs) ? pairs.slice() : [];
    pairs.push({
      label: getNextEntityName(
        "Option",
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pairs.map((pair: any) => pair.label),
      ),
      value: getNextEntityName(
        "OPTION",
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pairs.map((pair: any) => pair.value),
      ),
    });
    const updatedRenderPairs = renderPairs.slice();
    updatedRenderPairs.push({
      label: getNextEntityName(
        "Option",
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderPairs.map((pair: any) => pair.label),
      ),
      value: getNextEntityName(
        "OPTION",
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderPairs.map((pair: any) => pair.value),
      ),
      key: getNextEntityName(
        "OPTION",
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderPairs.map((pair: any) => pair.value),
      ),
    });

    setRenderPairs(updatedRenderPairs);
    validatePairs(updatedRenderPairs);
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
      {renderPairs.map((pair: SegmentedControlOptionWithKey, index) => {
        const hasError = !!errorMessages[index];
        return (
          <FlexBox key={pair.key}>
            <ControlWrapper orientation={"HORIZONTAL"}>
              <StyledInputGroup
                dataType={"text"}
                hasError={hasError}
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
                hasError={hasError}
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
            {errorMessages[index] && (
              <ErrorMessageBox>
                <WarningErrorIcon />
                {errorMessages[index]}
              </ErrorMessageBox>
            )}
          </FlexBox>
        );
      })}

      <div className="flex flex-row-reverse mt-1">
        <Button
          className="t--property-control-options-add"
          kind="tertiary"
          onClick={addPair}
          size="sm"
          startIcon="plus"
        >
          {props.addLabel || "Add option"}
        </Button>
      </div>
    </>
  );
}
