import React from "react";

import styled from "styled-components";
import { noop } from "lodash";

import { CommonComponentProps } from "components/ads/common";
import EditableTextSubComponent from "components/ads/EditableTextSubComponent";
import { EditInteractionKind, SavingState } from "components/ads/EditableText";

export type EditableAppNameProps = CommonComponentProps & {
  defaultValue: string;
  placeholder?: string;
  editInteractionKind: EditInteractionKind;
  defaultSavingState: SavingState;
  onClick?: typeof noop;
  onBlur?: (value: string) => void;
  isEditingDefault?: boolean;
  inputValidation?: (value: string) => string | boolean;
  hideEditIcon?: boolean;
  fill?: boolean;
  isError?: boolean;
  isEditing: boolean;
  setIsEditing: typeof noop;
  isInvalid: string | boolean;
  setIsInvalid: typeof noop;
  savingState: SavingState;
  setSavingState: typeof noop;
};

export const EditableAppNameWrapper = styled.div<{
  filled: boolean;
}>`
  ${(props) =>
    !props.filled
      ? `
    width: 243px;
  `
      : `
    width: 100%;
    flex: 1;
  `}
  .error-message {
    margin-left: ${(props) => props.theme.spaces[5]}px;
    color: ${(props) => props.theme.colors.danger.main};
  }
`;

export function EditableAppName(props: EditableAppNameProps) {
  const {
    className,
    cypressSelector,
    defaultSavingState,
    defaultValue,
    disabled,
    editInteractionKind,
    fill,
    hideEditIcon,
    inputValidation,
    isEditing,
    isEditingDefault,
    isError,
    isInvalid,
    isLoading,
    onBlur,
    onClick,
    placeholder,
    savingState,
    setIsEditing,
    setIsInvalid,
    setSavingState,
  } = props;

  const nonEditMode = () => {
    if (!isEditing && savingState === SavingState.SUCCESS) {
      setSavingState(SavingState.NOT_STARTED);
    }
  };

  return (
    <EditableAppNameWrapper
      filled={!!props.fill}
      onClick={onClick}
      onMouseEnter={nonEditMode}
    >
      <EditableTextSubComponent
        className={className}
        cypressSelector={cypressSelector}
        defaultSavingState={defaultSavingState}
        defaultValue={defaultValue}
        disabled={disabled}
        editInteractionKind={editInteractionKind}
        fill={fill}
        hideEditIcon={hideEditIcon}
        inputValidation={inputValidation}
        isEditing={isEditing}
        isEditingDefault={isEditingDefault}
        isError={isError}
        isInvalid={isInvalid}
        isLoading={isLoading}
        onBlur={onBlur}
        placeholder={placeholder}
        savingState={savingState}
        setIsEditing={setIsEditing}
        setIsInvalid={setIsInvalid}
        setSavingState={setSavingState}
        underline={false}
      />
    </EditableAppNameWrapper>
  );
}

export default EditableAppName;
