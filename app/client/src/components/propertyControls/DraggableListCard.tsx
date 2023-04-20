import React, { useCallback, useState, useRef, useEffect } from "react";
import styled from "styled-components";
import _ from "lodash";
import {
  StyledDragIcon,
  StyledActionContainer,
  StyledPinIcon,
  InputGroup,
} from "components/propertyControls/StyledControls";
import { Colors } from "constants/Colors";
import { Button, Checkbox } from "design-system";

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
    isChecked?: boolean;
    isCheckboxDisabled?: boolean;
    isDragDisabled?: boolean;
  };
  isDelete?: boolean;
  isDragging: boolean;
  showCheckbox?: boolean;
  placeholder: string;
  updateFocus?: (index: number, isFocused: boolean) => void;
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
  toggleVisibility?: (index: number) => void;
  toggleCheckbox?: (index: number, checked: boolean) => void;
  isAllColumnEditable?: boolean;
};

const PADDING_WITHOUT_CHECKBOX = 60;
const PADDING_WITH_CHECKBOX = 90;

const StyledInputGroup = styled(InputGroup)`
  input {
    padding-left: 20px;
  }
`;

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
    showCheckbox,
    toggleCheckbox,
    toggleVisibility,
    updateFocus,
    updateOption,
  } = props;
  const [visibility, setVisibility] = useState(item.isVisible);
  const ref = useRef<HTMLInputElement | null>(null);
  const debouncedUpdate = _.debounce(updateOption, 1000);

  useEffect(() => {
    setVisibility(item.isVisible);
  }, [item.isVisible]);

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
      updateFocus(index, false);
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

  const renderVisibilityIcon = () => {
    return visibility ? (
      <Button
        className="t--show-column-btn"
        isIconButton
        kind="tertiary"
        onClick={() => {
          setVisibility(!visibility);
          toggleVisibility && toggleVisibility(index);
        }}
        size="sm"
        startIcon="show-column"
      />
    ) : (
      <Button
        className="t--show-column-btn"
        isIconButton
        kind="tertiary"
        onClick={() => {
          setVisibility(!visibility);
          toggleVisibility && toggleVisibility(index);
        }}
        size="sm"
        startIcon="hide-column"
      />
    );
  };

  const showDelete = !!item.isDerived || isDelete;
  return (
    <ItemWrapper className={item.isDuplicateLabel ? "has-duplicate-label" : ""}>
      {item?.isDragDisabled ? (
        <StyledPinIcon name="pin" size="lg" />
      ) : (
        <StyledDragIcon name="drag-control" size="md" />
      )}

      <StyledInputGroup
        autoFocus={index === focusedIndex}
        className={
          props.item.isDuplicateLabel ? `t--has-duplicate-label-${index}` : ""
        }
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder={placeholder}
        ref={ref}
        rightPadding={
          showCheckbox ? PADDING_WITH_CHECKBOX : PADDING_WITHOUT_CHECKBOX
        }
        value={value}
        width="100%"
      />
      <StyledActionContainer>
        <Button
          className="t--edit-column-btn"
          isIconButton
          kind="tertiary"
          onClick={() => {
            onEdit && onEdit(index);
          }}
          size="sm"
          startIcon="settings-control"
        />
        {showDelete && (
          <Button
            className="t--delete-column-btn"
            isIconButton
            kind="tertiary"
            onClick={() => {
              deleteOption && deleteOption(index);
            }}
            size="sm"
            startIcon="delete-bin-line"
          />
        )}
        {!showDelete && toggleVisibility && renderVisibilityIcon()}
        {/*
         * Used in Table_Widget_V2's primary columns to enable/disable cell editability.
         * Using a common name `showCheckbox` instead of showEditable or isEditable,
         * to be generic and reusable.
         */}
        {showCheckbox && (
          <Checkbox
            className={`t--card-checkbox ${
              item.isChecked ? "t--checked" : "t--unchecked"
            }`}
            isDisabled={item.isCheckboxDisabled}
            isSelected={item.isChecked}
            onChange={(isSelected: boolean) =>
              toggleCheckbox && toggleCheckbox(index, isSelected)
            }
          />
        )}
      </StyledActionContainer>
    </ItemWrapper>
  );
}
