import EditableText, { EditableTextProps, SavingState } from "./EditableText";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { Variant } from "./common";
import { Toaster } from "./Toast";
import {
  createMessage,
  ERROR_EMPTY_APPLICATION_NAME,
} from "@appsmith/constants/messages";

type EditableTextWrapperProps = EditableTextProps & {
  variant: "UNDERLINE" | "ICON";
  isNewApp: boolean;
};

const Container = styled.div<{
  isEditing?: boolean;
  savingState: SavingState;
  isInvalid: boolean;
}>`
  position: relative;
  .editable-text-container {
    justify-content: center;
  }

  &&& .${Classes.EDITABLE_TEXT}, .icon-wrapper {
    padding: 5px 0px;
    height: 31px;
    background-color: ${(props) =>
      (props.isInvalid && props.isEditing) ||
      props.savingState === SavingState.ERROR
        ? props.theme.colors.editableText.dangerBg
        : "transparent"};
  }

  &&&& .${Classes.EDITABLE_TEXT}:hover {
    ${(props) =>
      !props.isEditing
        ? `
      border-bottom-style: solid; 
      border-bottom-width: 1px;
      width: fit-content;
      max-width: 194px;
    `
        : null}
  }

  &&&& .${Classes.EDITABLE_TEXT_CONTENT} {
    ${(props) =>
      !props.isEditing
        ? `
        min-width: 0px !important;
        height: auto !important;
        line-height: ${props.theme.typography.h4.lineHeight}px !important;
    `
        : null}
  }

  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    text-align: center;
    color: #d4d4d4;
    font-size: ${(props) => props.theme.typography.h4.fontSize}px;
    line-height: ${(props) => props.theme.typography.h4.lineHeight}px;
    letter-spacing: ${(props) => props.theme.typography.h4.letterSpacing}px;
    font-weight: ${(props) => props.theme.typography.h4.fontWeight};
    padding-right: 0px;
  }

  .icon-wrapper {
    padding-bottom: 0px;
    position: absolute;
    right: 0;
    top: 0;
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
      isInvalid={isValid}
      savingState={props.savingState}
    >
      <EditableText
        className={props.className}
        defaultValue={props.defaultValue}
        editInteractionKind={props.editInteractionKind}
        fill={!!props.fill}
        hideEditIcon={props.hideEditIcon}
        isEditingDefault={props.isNewApp}
        isInvalid={(value: string) => {
          setIsEditing(true);
          if (props.isInvalid) {
            setIsValid(Boolean(props.isInvalid(value)));
            return props.isInvalid(value);
          } else if (value.trim() === "") {
            Toaster.show({
              text: createMessage(ERROR_EMPTY_APPLICATION_NAME),
              variant: Variant.danger,
            });
            return false;
          } else {
            return false;
          }
        }}
        onBlur={(value) => {
          setIsEditing(false);
          props.onBlur && props.onBlur(value);
        }}
        onTextChanged={() => setIsEditing(true)}
        placeholder={props.placeholder}
        savingState={props.savingState}
      />
    </Container>
  );
}
