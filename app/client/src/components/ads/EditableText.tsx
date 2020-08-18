import React, { useState, useEffect } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import Edit from "assets/images/EditPen.svg";
import { Colors } from "constants/Colors";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { Icon } from "./Icon";
import { Size } from "./Button";
import Text, { TextType } from "./Text";

export enum EditInteractionKind {
  SINGLE,
  DOUBLE,
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
}>`
  display: flex;
  align-items: center;
  width: ${props => (!props.fill ? "234px" : "100%")};
  ${props => (props.isEditing && !props.isValid ? "margin-bottom: 6px" : null)};

  &&&& .bp3-editable-text {
    color: white;
    overflow: hidden;
    ${props =>
      !props.isEditing ? "padding: 10px 12px 10px 12px" : "padding: 0"};
    width: calc(100% - 40px);
  }

  &&&& .bp3-editable-text-content {
    cursor: pointer;
    ${props => (props.isEditing ? "display: none" : "display: inline")};
  }

  &&&& .bp3-editable-text-input {
    border: none;
    outline: none;
    background-color: ${props =>
      props.isValid && props.isEditing ? "#232324" : "rgba(226, 44, 44, 0.08)"};
    padding: 10px 0 10px 12px;
    color: white;
    min-width: 100%;
    max-width: 100%;
    width: 100%;
    border-radius: 0px;
  }

  .icon-wrapper {
    background-color: ${props =>
      !props.isEditing
        ? "transparent"
        : props.isValid
        ? "#232324"
        : "rgba(226, 44, 44, 0.08)"};
  }
`;

const IconWrapper = styled.div`
  width: 40px;
  padding: 12px 12px 12px 0px;
  /* height: 39px; */
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const AdsEditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(!!props.isEditingDefault);
  const [value, setValue] = useState(props.defaultValue);

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
    props.onBlur && props.onBlur();
    const isInvalid = props.isInvalid ? props.isInvalid(_value) : false;
    if (!isInvalid) {
      props.onTextChanged(_value);
      setIsEditing(false);
    } else {
      // condition for error
    }
  };

  const onInputchange = (_value: string) => {
    let finalVal: string = _value;
    if (props.valueTransform) {
      finalVal = props.valueTransform(_value);
    }
    setValue(finalVal);
  };

  const errorMessage = props.isInvalid && props.isInvalid(value);
  const error = errorMessage ? errorMessage : undefined;

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
          onCancel={props.onBlur}
        />
        {!props.minimal && !props.hideEditIcon && !props.updating && (
          <IconWrapper className="icon-wrapper">
            <Icon name={error ? "error" : "edit"} size={Size.large} />
          </IconWrapper>
        )}
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
