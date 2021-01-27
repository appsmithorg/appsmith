import EditableText, { EditableTextProps } from "components/ads/EditableText";
import React, { useState } from "react";
import styled from "styled-components";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";

type EditableTextWrapperProps = EditableTextProps & {
  isNewApp: boolean;
};

const Container = styled.div`
  & .bp3-editable-text-content:hover {
    text-decoration: underline;
  }
`;

export default function EditableTextWrapper(props: EditableTextWrapperProps) {
  const [isEditingDefault, setIsEditingDefault] = useState(props.isNewApp);

  return (
    <Container>
      <EditableText
        defaultValue={props.defaultValue}
        editInteractionKind={props.editInteractionKind}
        placeholder={props.placeholder}
        isEditingDefault={isEditingDefault}
        savingState={props.savingState}
        fill={props.fill}
        onBlur={(value) => {
          props.onBlur(value);
          setIsEditingDefault(false);
        }}
        className={props.className}
        isInvalid={(value: string) => {
          if (value.trim() === "") {
            Toaster.show({
              text: "Application name can't be empty",
              variant: Variant.danger,
            });
          }
          return false;
        }}
        hideEditIcon
      />
    </Container>
  );
}
