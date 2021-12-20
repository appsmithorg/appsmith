import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import ErrorTooltip from "./ErrorTooltip";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import Icon, { IconSize } from "components/ads/Icon";

export enum EditInteractionKind {
  SINGLE,
  DOUBLE,
}

type EditableTextProps = {
  type: "text" | "password" | "email" | "phone" | "date";
  defaultValue: string;
  onTextChanged: (value: string) => void;
  placeholder: string;
  className?: string;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  isInvalid?: (value: string) => string | boolean;
  editInteractionKind: EditInteractionKind;
  hideEditIcon?: boolean;
  minimal?: boolean;
  onBlur?: (value?: string) => void;
  beforeUnmount?: (value?: string) => void;
  errorTooltipClass?: string;
  maxLength?: number;
};

const EditableTextWrapper = styled.div<{
  isEditing: boolean;
  minimal: boolean;
}>`
  && {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    & .${Classes.EDITABLE_TEXT} {
      background: ${(props) =>
        props.isEditing && !props.minimal
          ? props.theme.colors.editableText.bg
          : "none"};
      cursor: pointer;
      padding: ${(props) => (!props.minimal ? "5px 5px" : "0px")};
      text-transform: none;
      flex: 1 0 100%;
      max-width: 100%;
      overflow: hidden;
      display: flex;
      &:before,
      &:after {
        display: none;
      }
    }
    & div.${Classes.EDITABLE_TEXT_INPUT} {
      text-transform: none;
      width: 100%;
    }
  }
`;

const TextContainer = styled.div<{ isValid: boolean; minimal: boolean }>`
  display: flex;
  &&&& .${Classes.EDITABLE_TEXT} {
    & .${Classes.EDITABLE_TEXT_CONTENT} {
      &:hover {
        text-decoration: ${(props) => (props.minimal ? "underline" : "none")};
      }
    }
  }
`;

export function EditableText(props: EditableTextProps) {
  const {
    beforeUnmount,
    className,
    defaultValue,
    editInteractionKind,
    errorTooltipClass,
    forceDefault,
    hideEditIcon,
    isEditingDefault,
    isInvalid,
    maxLength,
    minimal,
    onBlur,
    onTextChanged,
    placeholder,
    updating,
    valueTransform,
  } = props;
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [value, setStateValue] = useState(defaultValue);
  const inputValRef = useRef("");

  const setValue = useCallback((value) => {
    inputValRef.current = value;
    setStateValue(value);
  }, []);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setIsEditing(!!isEditingDefault);
  }, [defaultValue, isEditingDefault]);

  useEffect(() => {
    if (forceDefault === true) setValue(defaultValue);
  }, [forceDefault, defaultValue]);

  // at times onTextChange is not fired
  // for example when the modal is closed on clicking the overlay
  useEffect(() => {
    return () => {
      if (typeof beforeUnmount === "function")
        beforeUnmount(inputValRef.current);
    };
  }, [beforeUnmount]);

  const edit = (e: any) => {
    setIsEditing(true);
    e.preventDefault();
    e.stopPropagation();
  };
  const onChange = useCallback(
    (_value: string) => {
      onBlur && onBlur();
      const _isInvalid = isInvalid ? isInvalid(_value) : false;
      if (!_isInvalid) {
        onTextChanged(_value);
        setIsEditing(false);
      } else {
        Toaster.show({
          text: "Invalid name",
          variant: Variant.danger,
        });
      }
    },
    [isInvalid],
  );

  const onInputchange = useCallback(
    (_value: string) => {
      let finalVal: string = _value;
      if (valueTransform) {
        finalVal = valueTransform(_value);
      }
      setValue(finalVal);
    },
    [valueTransform],
  );

  const errorMessage = isInvalid && isInvalid(value);
  const error = errorMessage ? errorMessage : undefined;
  return (
    <EditableTextWrapper
      isEditing={isEditing}
      minimal={!!minimal}
      onClick={
        editInteractionKind === EditInteractionKind.SINGLE ? edit : _.noop
      }
      onDoubleClick={
        editInteractionKind === EditInteractionKind.DOUBLE ? edit : _.noop
      }
    >
      <ErrorTooltip
        customClass={errorTooltipClass}
        isOpen={!!error}
        message={errorMessage as string}
      >
        <TextContainer isValid={!error} minimal={!!minimal}>
          <BlueprintEditableText
            className={className}
            disabled={!isEditing}
            isEditing={isEditing}
            maxLength={maxLength}
            onCancel={onBlur}
            onChange={onInputchange}
            onConfirm={onChange}
            placeholder={placeholder}
            selectAllOnFocus
            value={value}
          />
          {!minimal && !hideEditIcon && !updating && !isEditing && (
            <Icon fillColor="#939090" name="edit" size={IconSize.XXL} />
          )}
        </TextContainer>
      </ErrorTooltip>
    </EditableTextWrapper>
  );
}

export default EditableText;
