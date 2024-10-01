import React, { useCallback, useState, useRef, useEffect } from "react";
import styled from "styled-components";
import _ from "lodash";
import {
  StyledIcon,
  StyledActionContainer,
  InputGroup,
} from "components/propertyControls/StyledControls";
import { Button, Checkbox } from "@appsmith/ads";

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  &.has-duplicate-label input[type="text"] {
    border-color: var(--ads-v2-color-border-error);
  }
`;

interface RenderComponentProps {
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
    itemType?: "SEPARATOR" | "BUTTON";
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
}

const PADDING_WITHOUT_CHECKBOX = 60;
const PADDING_WITH_CHECKBOX = 90;

const StyledInputGroup = styled(InputGroup)<{
  rightPadding?: number;
  isReadOnly?: boolean;
}>`
  input {
    padding-left: 20px;
    padding-right: ${(props) => props.rightPadding}px;
    text-overflow: ellipsis;
    cursor: ${(props) => (props.isReadOnly ? "default" : "text")} !important;
  }
`;

const StyledCheckbox = styled(Checkbox)`
  width: 16px;
  height: 16px;
  padding: 0;
  margin-top: 4px;
  margin-left: 4px;
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
  const isSeparator = item.itemType === "SEPARATOR";

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
        startIcon="eye-on"
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
        startIcon="eye-off"
      />
    );
  };

  const showDelete = !!item.isDerived || isDelete;

  return (
    <ItemWrapper className={item.isDuplicateLabel ? "has-duplicate-label" : ""}>
      {item?.isDragDisabled ? (
        <StyledIcon name="pin-3" size="md" />
      ) : (
        <StyledIcon name="drag-control" size="md" />
      )}

      <StyledInputGroup
        autoFocus={index === focusedIndex}
        className={
          props.item.isDuplicateLabel ? `t--has-duplicate-label-${index}` : ""
        }
        dataType="text"
        isReadOnly={isSeparator}
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
        {!isSeparator && (
          <Button
            className="t--edit-column-btn"
            isIconButton
            kind="tertiary"
            onClick={() => {
              onEdit && onEdit(index);
            }}
            onFocus={(e) => e.stopPropagation()}
            size="sm"
            startIcon="settings-2-line"
          />
        )}
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
        {!showDelete &&
          !isSeparator &&
          toggleVisibility &&
          renderVisibilityIcon()}
        {/*
         * Used in Table_Widget_V2's primary columns to enable/disable cell editability.
         * Using a common name `showCheckbox` instead of showEditable or isEditable,
         * to be generic and reusable.
         */}
        {showCheckbox && (
          <StyledCheckbox
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
