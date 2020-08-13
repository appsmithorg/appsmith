import React, { useState, useEffect } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import _ from "lodash";
import Edit from "assets/images/EditPen.svg";
import ErrorTooltip from "./ErrorTooltip";
import { Colors } from "constants/Colors";
import { AppToaster } from "components/editorComponents/ToastComponent";

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
};

const EditPen = styled.img`
  width: 14px;
  : hover {
    cursor: pointer;
  }
`;

const EditableTextWrapper = styled.div<{
  isEditing: boolean;
  minimal: boolean;
}>`
  && {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    & .${Classes.EDITABLE_TEXT} {
      border: ${props =>
        props.isEditing && !props.minimal
          ? `1px solid ${Colors.HIT_GRAY}`
          : "none"};
      cursor: pointer;
      padding: ${props => (!props.minimal ? "5px 5px" : "0px")};
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
  &&&& .bp3-editable-text {
    ${props => (!props.minimal ? "border-radius: 3px;" : "")}
    ${props =>
      !props.minimal
        ? `border-color: ${props.isValid ? Colors.HIT_GRAY : "red"}`
        : ""};
    ${props =>
      props.minimal ? `border-bottom: 1px solid ${Colors.HIT_GRAY}` : ""}
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
      AppToaster.show({
        message: "Invalid name",
        type: "error",
      });
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
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE ? edit : _.noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE ? edit : _.noop
      }
      minimal={!!props.minimal}
    >
      <ErrorTooltip isOpen={!!error} message={errorMessage as string}>
        <TextContainer isValid={!error} minimal={!!props.minimal}>
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
          {!props.minimal &&
            !props.hideEditIcon &&
            !props.updating &&
            !isEditing && <EditPen src={Edit} alt="Edit pen" />}
        </TextContainer>
      </ErrorTooltip>
    </EditableTextWrapper>
  );
};

export default EditableText;
