import React, { useState, useEffect } from "react";
import { EditableText as BlueprintEditableText } from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import { Icon } from "./Icon";
import { Size } from "./Button";
import Text, { TextType } from "./Text";
import Spinner from "./Spinner";
import { hexToRgba, ThemeProp } from "./common";

export enum EditInteractionKind {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
}

export type SavingStateHandler = (state: SavingState) => void;

export enum SavingState {
  NOT_STARTED = "NOT_STARTED",
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

type EditableTextProps = {
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
  fill?: boolean;
  onSubmit: (
    value: string,
    callback: SavingStateHandler,
  ) => { saving: SavingState };
};

const EditableTextWrapper = styled.div<{
  isEditing: boolean;
}>`
  height: ${props => props.theme.spaces[13] + 3}px;
  .error-message {
    color: ${props => props.theme.colors.danger.main};
  }
`;

const editModeBgcolor = (props: ThemeProp & TextContainerProps): string => {
  if (
    (props.isInvalid && props.isEditing) ||
    (props.savingState.isSaving && props.savingState.name === SavingState.ERROR)
  ) {
    return hexToRgba(props.theme.colors.danger.main, 0.08);
  } else if (!props.isInvalid && props.isEditing) {
    return props.theme.colors.blackShades[2];
  } else {
    return "transparent";
  }
};

type TextContainerProps = {
  isInvalid: boolean;
  isEditing: boolean;
  fill?: boolean;
  savingState: { name: SavingState; isSaving: boolean };
};

const TextContainer = styled.div<TextContainerProps>`
  display: flex;
  align-items: center;
  width: ${props => (!props.fill ? "234px" : "100%")};
  ${props =>
    props.isEditing && props.isInvalid
      ? `margin-bottom: ${props.theme.spaces[2]}px`
      : null};
  & > div {
    font-family: ${props => props.theme.fonts[2]};
    font-size: ${props => props.theme.typography.p1.fontSize}px;
    line-height: ${props => props.theme.typography.p1.lineHeight}px;
    letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
    font-weight: ${props => props.theme.typography.p1.fontWeight}px;
  }

  .bp3-editable-text {
    overflow: hidden;
    ${props =>
      !props.isEditing
        ? `padding: ${props.theme.spaces[4]}px ${props.theme.spaces[5]}px`
        : `padding: ${props.theme.spaces[0]}px`};
    width: calc(100% - 40px);

    .bp3-editable-text-content {
      cursor: pointer;
      color: ${props => props.theme.colors.blackShades[9]};
      overflow: hidden;
      text-overflow: ellipsis;
      ${props => (props.isEditing ? "display: none" : "display: block")};
    }

    .bp3-editable-text-input {
      border: none;
      outline: none;
      background-color: ${props => editModeBgcolor(props)};
      padding: ${props => props.theme.spaces[4]}px
        ${props => props.theme.spaces[0]}px ${props => props.theme.spaces[4]}px
        ${props => props.theme.spaces[5]}px;
      color: ${props => props.theme.colors.blackShades[9]};
      min-width: 100%;
      border-radius: ${props => props.theme.spaces[0]}px;
    }
  }

  .icon-wrapper {
    background-color: ${props => editModeBgcolor(props)};
  }
`;

const IconWrapper = styled.div`
  width: ${props => props.theme.spaces[13] + 4}px;
  padding-right: ${props => props.theme.spaces[5]}px;
  height: ${props => props.theme.spaces[13] + 3}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const AdsEditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(!!props.isEditingDefault);
  const [value, setValue] = useState(props.defaultValue);
  const [lastValidValue, setLastValidValue] = useState(props.defaultValue);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [changeStarted, setChangeStarted] = useState<boolean>(false);
  const [savingState, setSavingState] = useState<{
    isSaving: boolean;
    name: SavingState;
  }>({ isSaving: false, name: SavingState.NOT_STARTED });

  useEffect(() => {
    setValue(props.defaultValue);
    setIsEditing(!!props.isEditingDefault);
  }, [props.defaultValue, props.isEditingDefault]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(props.defaultValue);
  }, [props.forceDefault, props.defaultValue]);

  const editMode = (e: React.MouseEvent) => {
    setIsEditing(true);
    const errorMessage = props.isInvalid && props.isInvalid(props.defaultValue);
    setIsInvalid(errorMessage ? errorMessage : false);
    e.preventDefault();
    e.stopPropagation();
  };

  /* after clicking enter or onBlur this function will be called */
  const onConfirm = (_value: string) => {
    if (
      (savingState.isSaving && savingState.name === SavingState.ERROR) ||
      isInvalid
    ) {
      setValue(lastValidValue);
      setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
    } else if (changeStarted) {
      props.onTextChanged(_value);
      props.onSubmit(_value, SavingStateHandler);
    }
    setIsEditing(false);
    setChangeStarted(false);
  };

  const onInputchange = (_value: string) => {
    /* transformed  value */
    let finalVal: string = _value;
    if (props.valueTransform) {
      finalVal = props.valueTransform(_value);
    }
    setValue(finalVal);

    /* set the error state */
    const errorMessage = props.isInvalid && props.isInvalid(finalVal);
    const error = errorMessage ? errorMessage : false;
    if (!error) {
      setLastValidValue(finalVal);
    }
    setIsInvalid(error);
    setChangeStarted(true);
  };

  const SavingStateHandler = (state: SavingState) => {
    setIsEditing(false);
    switch (state) {
      case SavingState.STARTED:
        setSavingState({ isSaving: true, name: SavingState.STARTED });
        break;
      case SavingState.SUCCESS:
        setSavingState({ isSaving: true, name: SavingState.SUCCESS });
        break;
      case SavingState.ERROR:
        setValue(props.defaultValue);
        setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
        break;
      default:
        break;
    }
  };

  const iconName =
    !isEditing &&
    !savingState.isSaving &&
    savingState.name === SavingState.NOT_STARTED
      ? "edit"
      : !isEditing &&
        savingState.isSaving &&
        savingState.name === SavingState.SUCCESS
      ? "success"
      : (isEditing &&
          savingState.isSaving &&
          savingState.name === SavingState.ERROR) ||
        (isEditing && !!isInvalid)
      ? "error"
      : undefined;

  const nonEditMode = () => {
    if (
      !isEditing &&
      savingState.isSaving &&
      savingState.name === SavingState.SUCCESS
    ) {
      setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
    }
  };

  return (
    <EditableTextWrapper
      isEditing={isEditing}
      onMouseEnter={nonEditMode}
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE
          ? editMode
          : _.noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE
          ? editMode
          : _.noop
      }
    >
      <TextContainer
        isInvalid={!!isInvalid}
        isEditing={isEditing}
        savingState={savingState}
        fill={props.fill}
      >
        <BlueprintEditableText
          disabled={!isEditing}
          isEditing={isEditing}
          onChange={onInputchange}
          onConfirm={onConfirm}
          value={value}
          placeholder={props.placeholder}
          className={props.className}
          onCancel={onConfirm}
        />

        <IconWrapper className="icon-wrapper">
          {savingState.isSaving && savingState.name === SavingState.STARTED ? (
            <Spinner size={Size.large} />
          ) : (
            <Icon name={iconName} size={Size.large} />
          )}
        </IconWrapper>
      </TextContainer>
      {isEditing && !!isInvalid ? (
        <Text type={TextType.P2} className="error-message">
          {isInvalid}
        </Text>
      ) : null}
    </EditableTextWrapper>
  );
};

AdsEditableText.defaultProps = {
  fill: false,
};

export default AdsEditableText;
