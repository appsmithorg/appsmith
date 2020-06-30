import React, { useState, useEffect } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import Edit from "assets/images/EditPen.svg";
import ErrorTooltip from "./ErrorTooltip";

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
};

const EditPen = styled.img`
  width: 14px;
  : hover {
    cursor: pointer;
  }
`;

const EditableTextWrapper = styled.div<{ isEditing: boolean }>`
  && {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    & .${Classes.EDITABLE_TEXT} {
      border: ${props => (props.isEditing ? "1px solid #ccc" : "none")};
      cursor: pointer;
      padding: 5px 5px;
      text-transform: none;
      flex: 1 0 100%;
      max-width: 100%;
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

const TextContainer = styled.div<{ isValid: boolean }>`
  display: flex;
  &&&& .bp3-editable-text {
    border-radius: 3px;
    border-color: ${props => (props.isValid ? "hsl(0,0%,80%)" : "red")};
  }
`;

export const EditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(!!props.isEditingDefault);
  const [value, setValue] = useState(props.defaultValue);

  useEffect(() => {
    setValue(props.defaultValue);
  }, [props.defaultValue]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(props.defaultValue);
  }, [props.forceDefault]);

  const edit = (e: any) => {
    setIsEditing(true);
    e.preventDefault();
    e.stopPropagation();
  };
  const onChange = (_value: string) => {
    const isInvalid = props.isInvalid ? props.isInvalid(_value) : false;
    if (!isInvalid) {
      props.onTextChanged(_value);
    } else {
      setValue(props.defaultValue);
    }
    setIsEditing(false);
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
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE ? edit : _.noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE ? edit : _.noop
      }
    >
      <ErrorTooltip isOpen={!!error} message={errorMessage as string}>
        <TextContainer isValid={!error}>
          <BlueprintEditableText
            disabled={!isEditing}
            isEditing={isEditing}
            onChange={onInputchange}
            onConfirm={onChange}
            selectAllOnFocus
            value={value}
            placeholder={props.placeholder}
            className={props.className}
          />
          {!props.hideEditIcon && !props.updating && !isEditing && (
            <EditPen src={Edit} alt="Edit pen" />
          )}
        </TextContainer>
      </ErrorTooltip>
    </EditableTextWrapper>
  );
};

export default EditableText;
