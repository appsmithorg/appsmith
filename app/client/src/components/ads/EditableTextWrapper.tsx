import EditableText, { EditableTextProps, SavingState } from "./EditableText";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

type EditableTextWrapperProps = EditableTextProps & {
  variant: "UNDERLINE" | "ICON";
  isNewApp: boolean;
};

const Container = styled.div<{
  isEditing?: boolean;
  savingState: SavingState;
  isInvalid: boolean;
}>`
  .editable-text-container {
    justify-content: center;
  }

  &&& .${Classes.EDITABLE_TEXT}, .icon-wrapper {
    padding: 5px 10px;
    height: 25px;
    background-color: ${props =>
      (props.isInvalid && props.isEditing) ||
      props.savingState === SavingState.ERROR
        ? props.theme.colors.editableText.dangerBg
        : "transparent"};
  }

  &&&& .${Classes.EDITABLE_TEXT} {
    ${props =>
      !props.isEditing
        ? `
      padding-left: 0px;
      padding-right: 0px;
      border-bottom-style: solid; 
      border-bottom-width: 1px;
      width: fit-content;
    `
        : null}
  }

  &&&& .${Classes.EDITABLE_TEXT_CONTENT} {
    ${props =>
      !props.isEditing
        ? `
        min-width: 0px !important;
    `
        : null}
  }

  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    text-align: center;
    color: #d4d4d4;
    font-size: ${props => props.theme.typography.h4.fontSize}px;
    line-height: ${props => props.theme.typography.h4.lineHeight}px;
    letter-spacing: ${props => props.theme.typography.h4.letterSpacing}px;
    font-weight: ${props => props.theme.typography.h4.fontWeight}px;
  }

  .error-message {
    margin-top: 2px;
  }
`;

export default function EditableTextWrapper(props: EditableTextWrapperProps) {
  const [isEditing, setIsEditing] = useState(props.isNewApp);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsEditing(props.isNewApp);
  }, [props.isNewApp]);

  return (
    <Container
      isEditing={isEditing}
      savingState={props.savingState}
      isInvalid={isValid}
    >
      <EditableText
        defaultValue={props.defaultValue}
        editInteractionKind={props.editInteractionKind}
        placeholder={props.placeholder}
        hideEditIcon={props.hideEditIcon}
        isEditingDefault={props.isNewApp}
        savingState={props.savingState}
        fill={props.fill}
        onBlur={value => {
          setIsEditing(false);
          props.onBlur(value);
        }}
        className={props.className}
        onTextChanged={() => setIsEditing(true)}
        isInvalid={(value: string) => {
          setIsEditing(true);
          if (props.isInvalid) {
            setIsValid(Boolean(props.isInvalid(value)));
            return props.isInvalid(value);
          } else {
            return false;
          }
        }}
      />
    </Container>
  );
}
