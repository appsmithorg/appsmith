import React, { useState, useCallback, useEffect } from "react";

import styled from "styled-components";
import { noop } from "lodash";

import { CommonComponentProps } from "./common";
import EditableTextSubComponent, {
  EditInteractionKind,
  SavingState,
} from "./EditableTextSubComponent";

export { EditInteractionKind, SavingState };

export type EditableTextProps = CommonComponentProps & {
  defaultValue: string;
  placeholder?: string;
  editInteractionKind: EditInteractionKind;
  savingState: SavingState;
  onBlur?: (value: string) => void; // This `Blur` will be called only when there is a change in the value after we unfocus from the input field
  onBlurEverytime?: (value: string) => void; // This `Blur` will be called everytime we unfocus from the input field
  onTextChanged?: (value: string) => void;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  isInvalid?: (value: string) => string | boolean;
  hideEditIcon?: boolean;
  fill?: boolean;
  underline?: boolean;
  isError?: boolean;
  wrapperRef?: React.RefObject<HTMLDivElement>;
};

// Width of the component when the `filled` prop is false
export const UNFILLED_WIDTH = 243;

export const EditableTextWrapper = styled.div<{
  filled: boolean;
}>`
  ${(props) =>
    !props.filled
      ? `
    width: ${UNFILLED_WIDTH}px;
  `
      : `
    width: 100%;
    flex: 1;
  `}
  .error-message {
    margin-left: ${(props) => props.theme.spaces[5]}px;
    color: ${(props) => props.theme.colors.danger.main};
  }

  :focus-visible {
    outline: 1px solid var(--appsmith-input-focus-border-color) !important;
  }
`;

export function EditableText(props: EditableTextProps) {
  const {
    defaultValue,
    isEditingDefault,
    isInvalid: inputValidation,
    savingState: defaultSavingState,
    ...others
  } = props;
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );

  const editMode = useCallback(
    (e: React.MouseEvent) => {
      setIsEditing(true);
      const errorMessage = inputValidation && inputValidation(defaultValue);
      setIsInvalid(errorMessage ? errorMessage : false);
      e.preventDefault();
      e.stopPropagation();
    },
    [inputValidation, defaultValue],
  );

  const nonEditMode = () => {
    if (!isEditing && savingState === SavingState.SUCCESS) {
      setSavingState(SavingState.NOT_STARTED);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === props.wrapperRef?.current) {
          setIsEditing(true);
          e.preventDefault();
        }
        break;
      case "Escape":
        if (
          (e.target as HTMLInputElement).classList.contains(
            "bp3-editable-text-input",
          )
        )
          props.wrapperRef?.current?.focus();
        break;
    }
  };

  return (
    <EditableTextWrapper
      filled={!!props.fill}
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE
          ? editMode
          : noop
      }
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE
          ? editMode
          : noop
      }
      onMouseEnter={nonEditMode}
      ref={props.wrapperRef}
      tabIndex={0}
    >
      <EditableTextSubComponent
        defaultSavingState={defaultSavingState}
        defaultValue={defaultValue}
        inputValidation={inputValidation}
        isEditing={isEditing}
        isEditingDefault={isEditingDefault}
        isInvalid={isInvalid}
        savingState={savingState}
        setIsEditing={setIsEditing}
        setIsInvalid={setIsInvalid}
        setSavingState={setSavingState}
        {...others}
      />
    </EditableTextWrapper>
  );
}

export default EditableText;
