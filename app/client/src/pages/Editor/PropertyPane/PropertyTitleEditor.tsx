import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export type PropertyTitleEditorProps = {
  title: string;
  updatePropertyTitle: (title: string) => void;
};

/* eslint-disable react/display-name */
const PropertyTitleEditor = (props: PropertyTitleEditorProps) => {
  const { title, updatePropertyTitle } = props;
  const [name, setName] = useState(props.title);
  const [updating, toggleUpdating] = useState(false);
  const updateTitle = useCallback(
    (value: string) => {
      if (value && value.trim().length > 0 && value.trim() !== title.trim()) {
        updatePropertyTitle(value.trim());
      }
    },
    [updatePropertyTitle, title],
  );
  const exitEditMode = () => {
    toggleUpdating(true);
  };
  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  return (
    <Wrapper>
      <EditableText
        type="text"
        defaultValue={name}
        onTextChanged={updateTitle}
        placeholder={props.title}
        updating={updating}
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={false}
        onBlur={exitEditMode}
      />
    </Wrapper>
  );
};

export default PropertyTitleEditor;
