import React, { useCallback, useState, useRef, useEffect } from "react";
import styled from "styled-components";

import _ from "lodash";
import {
  StyledDragIcon,
  StyledOptionControlInputGroup,
  StyledEditIcon,
  StyledDeleteIcon,
  StyledVisibleIcon,
  StyledHiddenIcon,
} from "components/propertyControls/StyledControls";
import { Colors } from "constants/Colors";

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  &.has-duplicate-label > div:nth-child(2) {
    border: 1px solid ${Colors.DANGER_SOLID};
  }
`;

type RenderComponentProps = {
  focusedIndex: number | null | undefined;
  index: number;
  item: {
    label: string;
    isDerived?: boolean;
    isVisible?: boolean;
    isDuplicateLabel?: boolean;
  };
  isDelete?: boolean;
  isDragging: boolean;
  placeholder: string;
  updateFocus?: (index: number, isFocused: boolean) => void;
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
  toggleVisibility?: (index: number) => void;
};

export function DraggableListCard(props: RenderComponentProps) {
  const [value, setValue] = useState(props.item.label);
  const [isEditing, setEditing] = useState(false);

  const {
    deleteOption,
    focusedIndex,
    index,
    isDelete,
    isDragging,
    item,
    onEdit,
    placeholder,
    toggleVisibility,
    updateFocus,
    updateOption,
  } = props;
  const [visibility, setVisibility] = useState(item.isVisible);
  const ref = useRef<HTMLInputElement | null>(null);
  const debouncedUpdate = _.debounce(updateOption, 1000);

  useEffect(() => {
    if (!isEditing && item && item.label) setValue(item.label);
  }, [item?.label, isEditing]);

  useEffect(() => {
    if (focusedIndex !== null && focusedIndex === index && !isDragging) {
      if (ref && ref.current) {
        ref?.current.focus();
      }
    } else if (isDragging && focusedIndex === index) {
      if (ref && ref.current) {
        ref?.current.blur();
      }
    }
  }, [focusedIndex, isDragging]);

  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );

  const onFocus = () => {
    setEditing(false);
    if (updateFocus) {
      updateFocus(index, true);
    }
  };

  const onBlur = () => {
    if (!isDragging) {
      setEditing(false);
      if (updateFocus) {
        updateFocus(index, false);
      }
    }
  };

  return (
    <ItemWrapper
      className={props.item.isDuplicateLabel ? "has-duplicate-label" : ""}
    >
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        autoFocus={index === focusedIndex}
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder={placeholder}
        ref={ref}
        value={value}
        width="100%"
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
        width={20}
      />
      {!!item.isDerived || isDelete ? (
        <StyledDeleteIcon
          className="t--delete-column-btn"
          height={20}
          onClick={() => {
            deleteOption && deleteOption(index);
          }}
          width={20}
        />
      ) : visibility ? (
        <StyledVisibleIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
        />
      ) : (
        <StyledHiddenIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
        />
      )}
    </ItemWrapper>
  );
}
