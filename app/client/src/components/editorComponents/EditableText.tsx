import React, { useState, useEffect } from "react";
import {
  EditableText as BlueprintEditableText,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
type EditableTextProps = {
  type: "text" | "password" | "email" | "phone" | "date";
  defaultValue: string;
  onTextChanged: (value: string) => void;
  isEditing: boolean;
  placeholder: string;
  onChange?: (value: string) => void;
  value?: string;
};

const EditableTextWrapper = styled.div<{ isEditing: boolean }>`
  && {
    & .${Classes.EDITABLE_TEXT} {
      border: ${props => (props.isEditing ? "1px solid #ccc" : "none")};
      cursor: pointer;
      padding: 5px 10px;
      text-transform: none;
      &:before,
      &:after {
        display: none;
      }
    }
    & div.${Classes.EDITABLE_TEXT_INPUT} {
      text-transform: none;
    }
  }
`;

export const EditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(props.isEditing);
  useEffect(() => {
    setIsEditing(props.isEditing);
  }, [props.isEditing]);

  const edit = (e: any) => {
    setIsEditing(true);
    e.preventDefault();
    e.stopPropagation();
  };
  const onChange = (value: string) => {
    props.onTextChanged(value);
    setIsEditing(false);
  };
  return (
    <EditableTextWrapper onDoubleClick={edit} isEditing={isEditing}>
      <BlueprintEditableText
        {...props}
        disabled={!isEditing}
        isEditing={isEditing}
        onConfirm={onChange}
        selectAllOnFocus
      />
    </EditableTextWrapper>
  );
};

export default EditableText;
