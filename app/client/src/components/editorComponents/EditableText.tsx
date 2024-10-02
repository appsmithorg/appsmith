import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import {
  Button,
  Spinner,
  toast,
  Tooltip,
  type ButtonSizes,
} from "@appsmith/ads";
import { INVALID_NAME_ERROR, createMessage } from "ee/constants/messages";

export enum EditInteractionKind {
  SINGLE,
  DOUBLE,
}

interface EditableTextProps {
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
  underline?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  maxLines?: number;
  minLines?: number;
  customErrorTooltip?: string;
  useFullWidth?: boolean;
  iconSize?: ButtonSizes;
}

// using the !important keyword here is mandatory because a style is being applied to that element using the style attribute
// which has higher specificity than other css selectors. It seems the overriding style is being applied by the package itself.
const EditableTextWrapper = styled.div<{
  isEditing: boolean;
  minimal: boolean;
  useFullWidth: boolean;
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
          ? "var(--ads-v2-color-bg-subtle)"
          : "none"};
      cursor: pointer;
      padding: ${(props) => (!props.minimal ? "5px 5px" : "0px")};
      border-radius: var(--ads-v2-border-radius);
      text-transform: none;
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

  ${({ useFullWidth }) =>
    useFullWidth &&
    `
    > div {
    width: 100%;
    }
  `}
`;
const TextContainer = styled.div<{
  isValid: boolean;
  minimal: boolean;
  underline?: boolean;
}>`
  color: var(--ads-v2-color-fg-emphasis-plus);
  display: flex;
  align-items: center;
  &&&& .${Classes.EDITABLE_TEXT} {
    & .${Classes.EDITABLE_TEXT_CONTENT} {
      &:hover {
        text-decoration: ${(props) => (props.minimal ? "underline" : "none")};
        text-decoration-color: var(--ads-v2-color-border);
      }
    }
  }
  &&& .${Classes.EDITABLE_TEXT_CONTENT}:hover {
    ${(props) =>
      props.underline
        ? `
        border-bottom-style: solid;
        border-bottom-width: 1px;
        border-bottom-color: var(--ads-v2-color-border);
        width: fit-content;
      `
        : null}
  }

  && .t--action-name-edit-icon {
    min-width: min-content;
  }
`;

export function EditableText(props: EditableTextProps) {
  const {
    beforeUnmount,
    className,
    customErrorTooltip = "",
    defaultValue,
    disabled,
    editInteractionKind,
    errorTooltipClass,
    forceDefault,
    hideEditIcon,
    iconSize = "md",
    isEditingDefault,
    isInvalid,
    maxLength,
    maxLines,
    minimal,
    minLines,
    multiline,
    onBlur,
    onTextChanged,
    placeholder,
    underline,
    updating,
    useFullWidth,
    valueTransform,
  } = props;
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [value, setStateValue] = useState(defaultValue);
  const [errorMessage, setErrorMessage] = useState<string | boolean>("");
  const [error, setError] = useState<boolean>(false);
  const inputValRef = useRef("");
  const location = useLocation();

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

  // this removes the error tooltip when a user click on another
  // JS object while the previous one has the name error tooltip
  useEffect(() => {
    setError(false);
  }, [location.pathname]);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        toast.show(customErrorTooltip || createMessage(INVALID_NAME_ERROR), {
          kind: "error",
        });
      }
    },
    [isInvalid, onTextChanged],
  );

  const onInputchange = useCallback(
    (_value: string) => {
      let finalVal: string = _value;

      if (valueTransform) {
        finalVal = valueTransform(_value);
      }

      setValue(finalVal);
      const errorMessage = isInvalid && isInvalid(finalVal);

      if (errorMessage) {
        setError(true);
        setErrorMessage(errorMessage);
      } else {
        setError(false);
      }
    },
    [valueTransform, isInvalid],
  );

  const showEditIcon = !(disabled || minimal || hideEditIcon || isEditing);

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
      useFullWidth={!!(useFullWidth && isEditing)}
    >
      <Tooltip
        className={errorTooltipClass}
        content={errorMessage as string}
        visible={!!error}
      >
        <TextContainer
          isValid={!error}
          minimal={!!minimal}
          underline={underline}
        >
          <BlueprintEditableText
            className={className}
            disabled={disabled || !isEditing}
            isEditing={isEditing}
            maxLength={maxLength}
            maxLines={maxLines}
            minLines={minLines}
            multiline={multiline}
            onCancel={onBlur}
            onChange={onInputchange}
            onConfirm={onChange}
            placeholder={placeholder}
            selectAllOnFocus
            value={value}
          />
          {showEditIcon &&
            (updating ? (
              <Spinner size="md" />
            ) : (
              <Button
                className="t--action-name-edit-icon"
                isIconButton
                kind="tertiary"
                size={iconSize}
                startIcon="pencil-line"
              />
            ))}
        </TextContainer>
      </Tooltip>
    </EditableTextWrapper>
  );
}

export default EditableText;
