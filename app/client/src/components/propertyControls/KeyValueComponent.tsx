import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { ControlWrapper, InputGroup } from "./StyledControls";
import type { SegmentedControlOption } from "@appsmith/ads";
import { Button } from "@appsmith/ads";
import { generateReactKey } from "utils/generators";
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

const StyledBox = styled.div`
  width: 10px;
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

const StyledInputGroup = styled(InputGroup)`
  > .ads-v2-input__input-section > div {
    min-width: 0px;
  }
`;

export function KeyValueComponent(props: KeyValueComponentProps) {
  const [renderPairs, setRenderPairs] = useState<
    SegmentedControlOptionWithKey[]
  >([]);
  const [typing, setTyping] = useState<boolean>(false);
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
              // @ts-expect-error fix this the next time the file is edited
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
              // At least one pair must be present
              isDisabled={renderPairs.length <= 1}
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
