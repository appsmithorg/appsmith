import React, { useState, useEffect } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
// import Edit from "assets/images/EditPen.svg";
// import { Colors } from "constants/Colors";
// import { AppToaster } from "components/editorComponents/ToastComponent";
import { Icon } from "./Icon";
import { Size } from "./Button";
import Text, { TextType } from "./Text";
import Spinner from "./Spinner";

export enum EditInteractionKind {
  SINGLE,
  DOUBLE,
}

export type SavingFunc = (state: SavingState) => void;

export enum SavingState {
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  UNDEFINED = "UNDEFINED",
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
  minimal?: boolean;
  onBlur?: (value?: string) => void;
  fill?: boolean;
  apiCallback: (value: string, callback: SavingFunc) => { saving: SavingState };
};

const EditableTextWrapper = styled.div<{
  isEditing: boolean;
  minimal: boolean;
}>`
  .error-message {
    color: #e22c2c;
  }
`;

const TextContainer = styled.div<{
  isValid: boolean;
  minimal: boolean;
  isEditing: boolean;
  fill?: boolean;
  savingState: { name: SavingState; isSaving: boolean };
}>`
  display: flex;
  align-items: center;
  width: ${props => (!props.fill ? "234px" : "100%")};
  ${props => (props.isEditing && !props.isValid ? "margin-bottom: 6px" : null)};

  &&&& .bp3-editable-text {
    overflow: hidden;
    ${props =>
      !props.isEditing ? "padding: 10px 12px 10px 12px" : "padding: 0"};
    width: calc(100% - 40px);
  }

  &&&& .bp3-editable-text-content {
    cursor: pointer;
    color: #fff;
    font-family: ${props => props.theme.fonts[2]};
    font-size: 14px;
    line-height: 17px;
    letter-spacing: -0.24px;
    ${props => (props.isEditing ? "display: none" : "display: inline")};
  }

  &&&& .bp3-editable-text-input {
    border: none;
    outline: none;
    background-color: ${props =>
      props.savingState.isSaving &&
      props.savingState.name === SavingState.SUCCESS
        ? props.theme.colors.success.darkest
        : (!props.isValid && props.isEditing) ||
          (props.savingState.isSaving &&
            props.savingState.name === SavingState.ERROR)
        ? "rgba(226, 44, 44, 0.08)"
        : props.isValid && props.isEditing
        ? "#232324"
        : "transparent"};
    padding: 10px 0 10px 12px;
    color: white;
    min-width: 100%;
    max-width: 100%;
    width: 100%;
    border-radius: 0px;
  }

  .icon-wrapper {
    background-color: ${props =>
      props.savingState.isSaving &&
      props.savingState.name === SavingState.SUCCESS
        ? props.theme.colors.success.darkest
        : (!props.isValid && props.isEditing) ||
          (props.savingState.isSaving &&
            props.savingState.name === SavingState.ERROR)
        ? "rgba(226, 44, 44, 0.08)"
        : props.isValid && props.isEditing
        ? "#232324"
        : "transparent"};
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  /* padding: 12px 12px 12px 0px; */
  padding-right: 12px;
  height: 39px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const AdsEditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(!!props.isEditingDefault);
  const [value, setValue] = useState(props.defaultValue);
  const [savingState, setSavingState] = useState<{
    isSaving: boolean;
    name: SavingState;
  }>({ isSaving: false, name: SavingState.UNDEFINED });

  useEffect(() => {
    setValue(props.defaultValue);
    setIsEditing(!!props.isEditingDefault);
  }, [props.defaultValue, props.isEditingDefault]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(props.defaultValue);
  }, [props.forceDefault, props.defaultValue]);

  const edit = (e: any) => {
    setIsEditing(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const onChange = (_value: string) => {
    console.log("on change");

    props.onBlur && props.onBlur();

    const isInvalid = props.isInvalid ? props.isInvalid(_value) : false;

    if (
      (savingState.isSaving && savingState.name === SavingState.ERROR) ||
      isInvalid
    ) {
      setValue(props.defaultValue);
      setIsEditing(false);
      setSavingState({ isSaving: false, name: SavingState.UNDEFINED });
    } else {
      props.onTextChanged(_value);
      props.apiCallback(_value, SavingFunc);
      setIsEditing(false);
    }
  };

  const onInputchange = (_value: string) => {
    console.log("input change");

    let finalVal: string = _value;
    if (props.valueTransform) {
      finalVal = props.valueTransform(_value);
    }
    setValue(finalVal);
  };

  const errorMessage = props.isInvalid && props.isInvalid(value);
  const error = errorMessage ? errorMessage : undefined;

  console.log({ error });

  const SavingFunc = (state: SavingState) => {
    console.log({ state });

    if (state === SavingState.STARTED) {
      setSavingState({ isSaving: true, name: SavingState.STARTED });
    }
    if (state === SavingState.SUCCESS) {
      setSavingState({ isSaving: true, name: SavingState.SUCCESS });
      setIsEditing(true);
      setTimeout(() => {
        setSavingState({ isSaving: false, name: SavingState.UNDEFINED });
        setIsEditing(false);
      }, 2000);
    }
    if (state === SavingState.ERROR) {
      setSavingState({ isSaving: true, name: SavingState.ERROR });
      setIsEditing(true);
    }
  };

  const iconName = !isEditing
    ? "edit"
    : error
    ? "error"
    : savingState.isSaving && savingState.name === SavingState.SUCCESS
    ? "success"
    : savingState.isSaving && savingState.name === SavingState.ERROR
    ? "error"
    : undefined;

  return (
    <EditableTextWrapper
      isEditing={isEditing}
      minimal={!!props.minimal}
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE ? edit : _.noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE ? edit : _.noop
      }
    >
      <TextContainer
        isValid={!error}
        minimal={!!props.minimal}
        isEditing={isEditing}
        savingState={savingState}
        fill={props.fill}
      >
        <BlueprintEditableText
          disabled={!isEditing}
          isEditing={isEditing}
          onChange={onInputchange}
          onConfirm={onChange}
          selectAllOnFocus
          value={value}
          placeholder={props.placeholder}
          className={props.className}
          onCancel={onChange}
        />

        <IconWrapper className="icon-wrapper">
          {savingState.isSaving && savingState.name === SavingState.STARTED ? (
            <Spinner size={Size.large} />
          ) : (
            <Icon name={iconName} size={Size.large} />
          )}
        </IconWrapper>
      </TextContainer>
      {isEditing && error ? (
        <Text type={TextType.P2} className="error-message">
          {errorMessage}
        </Text>
      ) : null}
    </EditableTextWrapper>
  );
};

AdsEditableText.defaultProps = {
  fill: false,
};

export default AdsEditableText;
