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
import Text, { TextType } from "./Text";
import Spinner from "./Spinner";
import { CommonComponentProps } from "./common";
import { noop } from "lodash";
import Icon, { IconSize } from "./Icon";

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

export type EditableTextProps = CommonComponentProps & {
  defaultValue: string;
  placeholder?: string;
  editInteractionKind: EditInteractionKind;
  savingState: SavingState;
  onBlur?: (value: string) => void;
  onTextChanged?: (value: string) => void;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  isInvalid?: (value: string) => string | boolean;
  hideEditIcon?: boolean;
  fill?: boolean;
  underline?: boolean;
};

export const EditableTextWrapper = styled.div<{
  filled: boolean;
}>`
  ${(props) =>
    !props.filled
      ? `
    width: 243px;
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

  &&&
    .${BlueprintClasses.EDITABLE_TEXT_CONTENT},
    &&&
    .${BlueprintClasses.EDITABLE_TEXT_INPUT} {
    font-size: ${(props) => props.theme.typography.p1.fontSize}px;
    line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
    letter-spacing: ${(props) => props.theme.typography.p1.letterSpacing}px;
    font-weight: ${(props) => props.theme.typography.p1.fontWeight};
  }

  &&& .${BlueprintClasses.EDITABLE_TEXT_CONTENT} {
    cursor: pointer;
    color: ${(props) => props.theme.colors.editableText.color};
    overflow: hidden;
    text-overflow: ellipsis;
    ${(props) => (props.isEditing ? "display: none" : "display: block")};
    width: fit-content !important;
    min-width: auto !important;
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
    height: ${(props) => props.theme.spaces[14] + 1}px;
    padding: ${(props) => props.theme.spaces[4]}px
      ${(props) => props.theme.spaces[5]}px;
    width: calc(100% - 40px);
    background-color: ${(props) => props.bgColor};
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

export const EditableText = (props: EditableTextProps) => {
  const {
    onBlur,
    onTextChanged,
    isInvalid: inputValidation,
    defaultValue,
    isEditingDefault,
    valueTransform,
  } = props;
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [value, setValue] = useState(defaultValue);
  const [lastValidValue, setLastValidValue] = useState(defaultValue);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [changeStarted, setChangeStarted] = useState<boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );

  useEffect(() => {
    setSavingState(props.savingState);
  }, [props.savingState]);

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

  const editMode = useCallback(
    (e: React.MouseEvent) => {
      setIsEditing(true);
      const errorMessage = inputValidation && inputValidation(defaultValue);
      setIsInvalid(errorMessage ? errorMessage : false);
      e.preventDefault();
      e.stopPropagation();
    },
    [inputValidation, defaultValue],
  );

  const onConfirm = useCallback(
    (_value: string) => {
      const finalVal: string = _value.trim();
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

  const nonEditMode = () => {
    if (!isEditing && savingState === SavingState.SUCCESS) {
      setSavingState(SavingState.NOT_STARTED);
    }
  };

  return (
    <EditableTextWrapper
      filled={!!props.fill}
      onMouseEnter={nonEditMode}
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE
          ? editMode
          : noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE
          ? editMode
          : noop
      }
    >
      <TextContainer
        className="editable-text-container"
        data-cy={props.cypressSelector}
        isInvalid={!!isInvalid}
        isEditing={isEditing}
        bgColor={bgColor}
        underline={props.underline}
      >
        <BlueprintEditableText
          disabled={!isEditing}
          isEditing={isEditing}
          onChange={onInputchange}
          onConfirm={onConfirm}
          value={value}
          selectAllOnFocus
          placeholder={props.placeholder || defaultValue}
          className={props.className}
          onCancel={onConfirm}
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
    </EditableTextWrapper>
  );
};

export default EditableText;
