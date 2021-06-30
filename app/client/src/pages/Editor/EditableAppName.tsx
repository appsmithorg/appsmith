import EditableText, { EditableTextProps } from "components/ads/EditableText";
import React, { useState } from "react";
import styled from "styled-components";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { Classes } from "@blueprintjs/core";
import { getTypographyByKey } from "constants/DefaultTheme";

type EditableTextWrapperProps = EditableTextProps & {
  isNewApp: boolean;
  isError: boolean;
};

const Container = styled.div`
  & .bp3-editable-text-content:hover {
    text-decoration: underline;
  }
  & .${Classes.EDITABLE_TEXT} {
    height: ${(props) => props.theme.smallHeaderHeight} !important;
    display: flex;
    align-items: center;
  }
  &&&& .${Classes.EDITABLE_TEXT}, &&&& .${Classes.EDITABLE_TEXT_EDITING} {
    padding: 0 ${(props) => props.theme.spaces[0]}px;
  }
  &&&& .${Classes.EDITABLE_TEXT_CONTENT}, &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    display: inline;
    ${(props) => getTypographyByKey(props, "h4")};
    line-height: 19px !important;
    padding: 0;
    height: unset !important;
    position: relative;
    top: 1px;
    width: unset !important;
  }
  &&&& .${Classes.EDITABLE_TEXT_CONTENT} {
    min-width: 0;
  }
  flex: 1;
  overflow: auto;
`;

export default function EditableTextWrapper(props: EditableTextWrapperProps) {
  const [isEditingDefault, setIsEditingDefault] = useState(props.isNewApp);

  return (
    <Container>
      <EditableText
        className={props.className}
        defaultValue={props.defaultValue}
        editInteractionKind={props.editInteractionKind}
        fill={props.fill}
        hideEditIcon
        isEditingDefault={isEditingDefault}
        isError={props.isError}
        isInvalid={(value: string) => {
          if (value.trim() === "") {
            Toaster.show({
              text: "Application name can't be empty",
              variant: Variant.danger,
            });
          }
          return false;
        }}
        onBlur={(value) => {
          if (props.onBlur) props.onBlur(value);
          setIsEditingDefault(false);
        }}
        placeholder={props.placeholder}
        savingState={props.savingState}
      />
    </Container>
  );
}
