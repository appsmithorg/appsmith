import { Button } from "@appsmith/ads";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { ControlWrapper, InputGroup } from "./StyledControls";

function updateOptionLabel<T>(
  items: Array<T>,
  index: number,
  updatedLabel: string,
) {
  return items.map((option: T, optionIndex) => {
    if (index !== optionIndex) {
      return option;
    }

    return updatedLabel;
  });
}

const StyledBox = styled.div`
  width: 10px;
`;

type UpdateItemsFunction = (
  items: string[],
  isUpdatedViaKeyboard?: boolean,
) => void;

interface ArrayComponentProps {
  items: string[];
  updateItems: UpdateItemsFunction;
  addLabel?: string;
}

const StyledInputGroup = styled(InputGroup)`
  > .ads-v2-input__input-section > div {
    flex: 1;
    min-width: 0px;
  }
`;

export function ArrayComponent(props: ArrayComponentProps) {
  const [renderItems, setRenderItems] = useState<string[]>([]);
  const [typing, setTyping] = useState<boolean>(false);
  const { items } = props;

  useEffect(() => {
    let { items } = props;

    items = Array.isArray(items) ? items.slice() : [];

    items.length !== 0 && !typing && setRenderItems(items);
  }, [props, items.length, renderItems.length, typing]);

  const debouncedUpdateItems = useCallback(
    debounce((updatedItems: string[]) => {
      props.updateItems(updatedItems, true);
    }, 200),
    [props.updateItems],
  );

  function updateKey(index: number, updatedKey: string) {
    let { items } = props;

    items = Array.isArray(items) ? items : [];
    const updatedItems = updateOptionLabel(items, index, updatedKey);
    const updatedRenderItems = updateOptionLabel(
      renderItems,
      index,
      updatedKey,
    );

    setRenderItems(updatedRenderItems);
    debouncedUpdateItems(updatedItems);
  }

  function deleteItem(index: number, isUpdatedViaKeyboard = false) {
    let { items } = props;

    items = Array.isArray(items) ? items : [];

    const newItems = items.filter((o, i) => i !== index);
    const newRenderItems = renderItems.filter((o, i) => i !== index);

    setRenderItems(newRenderItems);
    props.updateItems(newItems, isUpdatedViaKeyboard);
  }

  function addItem(e: React.MouseEvent) {
    let { items } = props;

    items = Array.isArray(items) ? items.slice() : [];

    items.push("");

    const updatedRenderItems = renderItems.slice();

    updatedRenderItems.push("");

    setRenderItems(updatedRenderItems);
    props.updateItems(items, e.detail === 0);
  }

  function onInputFocus() {
    setTyping(true);
  }

  function onInputBlur() {
    setTyping(false);
  }

  return (
    <>
      {renderItems.map((item: string, index) => {
        return (
          <ControlWrapper key={index} orientation={"HORIZONTAL"}>
            <StyledInputGroup
              dataType={"text"}
              onBlur={onInputBlur}
              onChange={(value: string) => updateKey(index, value)}
              onFocus={onInputFocus}
              value={item}
            />
            <StyledBox />
            <Button
              isIconButton
              kind="tertiary"
              onClick={(e: React.MouseEvent) =>
                deleteItem(index, e.detail === 0)
              }
              size="sm"
              startIcon="delete-bin-line"
            />
          </ControlWrapper>
        );
      })}

      <div className="flex flex-row-reverse mt-1">
        <Button
          className="t--property-control-options-add"
          kind="tertiary"
          onClick={addItem}
          size="sm"
          startIcon="plus"
        >
          {props.addLabel || "Add suggestion"}
        </Button>
      </div>
    </>
  );
}
