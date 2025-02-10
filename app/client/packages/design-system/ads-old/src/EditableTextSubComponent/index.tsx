import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes as BlueprintClasses,
} from "@blueprintjs/core";
import styled from "styled-components";
import type noop from "lodash/noop";
import { Icon, Spinner } from "@appsmith/ads";
import { Text, TextType } from "../index";
import type { CommonComponentProps } from "../types/common";

export enum EditInteractionKind {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
}

export enum SavingState {
  STARTED = "STARTED",
  NOT_STARTED = "NOT_STARTED",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type EditableTextSubComponentProps = CommonComponentProps & {
  defaultValue: string;
  placeholder?: string;
  editInteractionKind: EditInteractionKind;
  defaultSavingState: SavingState;
  savingState: SavingState;
  setSavingState: typeof noop;
  onBlur?: (value: string) => void; // This `Blur` will be called only when there is a change in the value after we unfocus from the input field
  onBlurEverytime?: (value: string) => void; // This `Blur` will be called everytime we unfocus from the input field
  onTextChanged?: (value: string) => void;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  isEditing: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  setIsEditing: typeof noop;
  inputValidation?: (value: string) => string | boolean;
  isInvalid: string | boolean;
  setIsInvalid: typeof noop;
  hideEditIcon?: boolean;
  fill?: boolean;
  underline?: boolean;
  isError?: boolean;
};

const editModeBgcolor = (
  isInvalid: boolean,
  isEditing: boolean,
  savingState: SavingState,
): string => {
  if (
    (isInvalid && isEditing) ||
    savingState === SavingState.ERROR ||
    (!isInvalid && isEditing)
  ) {
    return "var(--ads-editable-text-subcomponent-default-background-color)";
  } else {
    return "transparent";
  }
};

const TextContainer = styled.div<{
  isInvalid: boolean;
  isEditing: boolean;
  bgColor: string;
  underline?: boolean;
}>`
  display: flex;
  align-items: center;
  .bp3-editable-text.bp3-editable-text-editing::before,
  .bp3-editable-text.bp3-disabled::before {
    display: none;
  }

  &&& .${BlueprintClasses.EDITABLE_TEXT_CONTENT} {
    cursor: pointer;
    color: var(--ads-editable-text-subcomponent-default-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    ${(props) => (props.isEditing ? "display: none" : "display: block")};
    width: fit-content !important;
    min-width: auto !important;
    line-height: inherit !important;
  }

  &&& .${BlueprintClasses.EDITABLE_TEXT_CONTENT}:hover {
    ${(props) =>
      props.underline && !props.isEditing
        ? `
        border-bottom-style: solid;
        border-bottom-width: 1px;
        width: fit-content;
      `
        : null}
  }
  &&& .${BlueprintClasses.EDITABLE_TEXT_INPUT} {
    border: none;
    outline: none;
    height: calc(var(--ads-spaces-14) + 1px);
    color: var(--ads-editable-text-subcomponent-default-text-color);
    min-width: 100%;
    border-radius: var(--ads-v2-border-radius);
  }

  &&& .${BlueprintClasses.EDITABLE_TEXT} {
    overflow: hidden;
    background-color: ${(props) => props.bgColor};
    width: calc(100% - 40px);
    border-radius: var(--ads-v2-border-radius);
  }

  .icon-wrapper {
    background-color: ${(props) => props.bgColor};
  }
`;

export const EditableTextSubComponent = React.forwardRef(
  (props: EditableTextSubComponentProps, ref: any) => {
    const {
      defaultValue,
      inputValidation,
      isEditing,
      isEditingDefault,
      isError,
      isInvalid,
      onBlur,
      onBlurEverytime,
      onTextChanged,
      savingState,
      setIsEditing,
      setIsInvalid,
      setSavingState,
      valueTransform,
    } = props;
    const [value, setValue] = useState(defaultValue);
    const [lastValidValue, setLastValidValue] = useState(defaultValue);
    const [changeStarted, setChangeStarted] = useState<boolean>(false);

    useEffect(() => {
      if (isError) {
        // if there is any error occurs while saving appname.
        // last saved app name will be shown to user.
        setValue(defaultValue);
      }
    }, [isError]);

    useEffect(() => {
      setSavingState(props.defaultSavingState);
    }, [props.defaultSavingState]);

    useEffect(() => {
      setValue(defaultValue);
      setLastValidValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
      setIsEditing(!!isEditingDefault);
    }, [defaultValue, isEditingDefault]);

    useEffect(() => {
      if (props.forceDefault === true) setValue(defaultValue);
    }, [props.forceDefault, defaultValue]);

    const bgColor = useMemo(
      () => editModeBgcolor(!!isInvalid, isEditing, savingState),
      [isInvalid, isEditing, savingState],
    );

    const onConfirm = useCallback(
      (_value: string) => {
        const finalVal: string = _value.trim();

        onBlurEverytime && onBlurEverytime(finalVal);

        if (savingState === SavingState.ERROR || isInvalid || finalVal === "") {
          setValue(lastValidValue);
          onBlur && onBlur(lastValidValue);
          setSavingState(SavingState.NOT_STARTED);
        }

        if (changeStarted) {
          onTextChanged && onTextChanged(finalVal);
        }

        if (finalVal && finalVal !== defaultValue) {
          onBlur && onBlur(finalVal);
        }

        setIsEditing(false);
        setChangeStarted(false);
      },
      [
        changeStarted,
        savingState,
        isInvalid,
        lastValidValue,
        onBlur,
        onTextChanged,
      ],
    );

    const onInputchange = useCallback(
      (_value: string) => {
        let finalVal: string =
          _value.indexOf(" ") === 0 ? _value.trim() : _value;

        if (valueTransform) {
          finalVal = valueTransform(finalVal);
        }

        const errorMessage = inputValidation && inputValidation(finalVal);
        const error = errorMessage ? errorMessage : false;

        if (!error && finalVal !== "") {
          setLastValidValue(finalVal);
          onTextChanged && onTextChanged(finalVal);
        }

        setValue(finalVal);
        setIsInvalid(error);
        setChangeStarted(true);
      },
      [inputValidation, onTextChanged],
    );

    const iconName =
      !isEditing &&
      savingState === SavingState.NOT_STARTED &&
      !props.hideEditIcon
        ? "pencil-line"
        : !isEditing && savingState === SavingState.SUCCESS
          ? "success"
          : savingState === SavingState.ERROR || (isEditing && !!isInvalid)
            ? "error"
            : undefined;

    return (
      <>
        <TextContainer
          bgColor={bgColor}
          className="editable-text-container"
          data-cy={props.cypressSelector}
          isEditing={isEditing}
          isInvalid={!!isInvalid}
          underline={props.underline}
        >
          <BlueprintEditableText
            className={props.className}
            disabled={!isEditing}
            isEditing={isEditing}
            onCancel={onConfirm}
            onChange={onInputchange}
            onConfirm={onConfirm}
            placeholder={props.placeholder || defaultValue}
            ref={ref}
            selectAllOnFocus
            value={value}
          />

          {savingState === SavingState.STARTED ? (
            <Spinner size="md" />
          ) : value && !props.hideEditIcon && iconName ? (
            <Icon className="cursor-pointer" name={iconName} size="md" />
          ) : null}
        </TextContainer>
        {isEditing && !!isInvalid ? (
          <Text className="error-message" type={TextType.P2}>
            {isInvalid}
          </Text>
        ) : null}
      </>
    );
  },
);

EditableTextSubComponent.displayName = "EditableTextSubComponent";

export default EditableTextSubComponent;
