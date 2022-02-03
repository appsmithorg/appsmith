import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from "react";

import {
  EditableText as BlueprintEditableText,
  Classes as BlueprintClasses,
} from "@blueprintjs/core";
import styled, { ThemeContext } from "styled-components";
import { noop } from "lodash";

import Text, { TextType } from "./Text";
import Spinner from "./Spinner";
import { CommonComponentProps } from "./common";
import Icon, { IconSize } from "./Icon";
import { UNFILLED_WIDTH } from "./EditableText";

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

export const EditableTextWrapper = styled.div<{
  filled: boolean;
}>`
  ${(props) =>
    !props.filled
      ? `
    width: ${UNFILLED_WIDTH}px;
  `
      : `
    width: 100%;
    flex: 1;
  `}
  .error-message {
    margin-left: ${(props) => props.theme.spaces[5]}px;
    color: ${(props) => props.theme.colors.danger.main};
  }
`;

const editModeBgcolor = (
  isInvalid: boolean,
  isEditing: boolean,
  savingState: SavingState,
  theme: any,
): string => {
  if ((isInvalid && isEditing) || savingState === SavingState.ERROR) {
    return theme.colors.editableText.dangerBg;
  } else if (!isInvalid && isEditing) {
    return theme.colors.editableText.bg;
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
    color: ${(props) => props.theme.colors.editableText.color};
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
    height: ${(props) => props.theme.spaces[14] + 1}px;
    color: ${(props) => props.theme.colors.editableText.color};
    min-width: 100%;
    border-radius: ${(props) => props.theme.spaces[0]}px;
  }

  &&& .${BlueprintClasses.EDITABLE_TEXT} {
    overflow: hidden;
    background-color: ${(props) => props.bgColor};
    width: calc(100% - 40px);
  }

  .icon-wrapper {
    background-color: ${(props) => props.bgColor};
  }
`;

const IconWrapper = styled.div`
  width: ${(props) => props.theme.spaces[15]}px;
  padding-right: ${(props) => props.theme.spaces[5]}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export function EditableTextSubComponent(props: EditableTextSubComponentProps) {
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
  }, [defaultValue]);

  useEffect(() => {
    setIsEditing(!!isEditingDefault);
  }, [defaultValue, isEditingDefault]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(defaultValue);
  }, [props.forceDefault, defaultValue]);

  const theme = useContext(ThemeContext);

  const bgColor = useMemo(
    () => editModeBgcolor(!!isInvalid, isEditing, savingState, theme),
    [isInvalid, isEditing, savingState, theme],
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
      let finalVal: string = _value.indexOf(" ") === 0 ? _value.trim() : _value;
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
    !isEditing && savingState === SavingState.NOT_STARTED && !props.hideEditIcon
      ? "edit"
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
          selectAllOnFocus
          value={value}
        />

        {savingState === SavingState.STARTED ? (
          <IconWrapper className="icon-wrapper">
            <Spinner size={IconSize.XL} />
          </IconWrapper>
        ) : value && !props.hideEditIcon ? (
          <IconWrapper className="icon-wrapper">
            <Icon name={iconName} size={IconSize.XL} />
          </IconWrapper>
        ) : null}
      </TextContainer>
      {isEditing && !!isInvalid ? (
        <Text className="error-message" type={TextType.P2}>
          {isInvalid}
        </Text>
      ) : null}
    </>
  );
}

export default EditableTextSubComponent;
