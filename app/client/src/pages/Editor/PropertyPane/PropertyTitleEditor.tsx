import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

export type PropertyTitleEditorProps = {
  title: string;
  propertyId: string;
  updatePropertyTitle: (propertyId: string, title: string) => void;
};

/* eslint-disable react/display-name */
const PropertyTitleEditor = (props: PropertyTitleEditorProps) => {
  const { title, propertyId, updatePropertyTitle } = props;
  const [name, setName] = useState(props.title);
  const [updating, toggleUpdating] = useState(false);
  const updateTitle = useCallback(
    (value: string) => {
      if (
        value &&
        value.trim().length > 0 &&
        value.trim() !== title.trim() &&
        propertyId
      ) {
        updatePropertyTitle(propertyId, value.trim());
      }
    },
    [updatePropertyTitle, title, propertyId],
  );
  const exitEditMode = () => {
    toggleUpdating(true);
  };
  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  return props.propertyId ? (
    <Wrapper>
      <EditableText
        type="text"
        valueTransform={removeSpecialChars}
        defaultValue={name}
        onTextChanged={updateTitle}
        placeholder={props.title}
        updating={updating}
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={false}
        onBlur={exitEditMode}
      />
    </Wrapper>
  ) : null;
};

export default PropertyTitleEditor;
