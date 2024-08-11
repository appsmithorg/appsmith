import React from "react";

import styled from "styled-components";
import type { noop } from "lodash";

import type {
  CommonComponentProps,
  EditInteractionKind,
} from "@appsmith/ads-old";
import {
  EditableTextSubComponent,
  SavingState,
  UNFILLED_WIDTH,
} from "@appsmith/ads-old";

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
    width: ${UNFILLED_WIDTH}px;
  `
      : `
    width: 100%;
    flex: 1;
    max-width: ${UNFILLED_WIDTH}px;
  `}
  .error-message {
    margin-left: ${(props) => props.theme.spaces[5]}px;
    color: ${(props) => props.theme.colors.danger.main};
  }
`;

export function EditableAppName(props: EditableAppNameProps) {
  const { isEditing, onClick, savingState, setSavingState, ...others } = props;

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
        isEditing={isEditing}
        savingState={savingState}
        setSavingState={setSavingState}
        underline={false}
        {...others}
      />
    </EditableAppNameWrapper>
  );
}

export default EditableAppName;
