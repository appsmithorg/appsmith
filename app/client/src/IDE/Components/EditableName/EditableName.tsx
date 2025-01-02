import React, { useMemo } from "react";
import { Spinner, Text as ADSText, Tooltip } from "@appsmith/ads";
import { useValidateEntityName } from "./useValidateEntityName";
import styled from "styled-components";
// This import is temporary and will be removed once the component is moved to the design-system
import { useEditableText } from "@appsmith/ads/src/Templates/EntityExplorer/Editable";

interface EditableTextProps {
  name: string;
  /** isLoading true will show a spinner **/
  isLoading?: boolean;
  /** if a valid name is entered, the onNameSave
   * will be called with the new name */
  onNameSave: (name: string) => void;
  /** Used in conjunction with exit editing to control
   *  this component input editable state  */
  isEditing: boolean;
  /** Used in conjunction with exit editing to control this component
   *  input editable state This function will be called when the
   *  user is trying to exit the editing mode **/
  exitEditing: () => void;
  /** Icon is replaced by spinner when isLoading is shown */
  icon: React.ReactNode;
  inputTestId?: string;
}

export const Text = styled(ADSText)`
  min-width: 3ch;
`;

export const EditableName = ({
  exitEditing,
  icon,
  inputTestId,
  isEditing,
  isLoading = false,
  name,
  onNameSave,
}: EditableTextProps) => {
  const validateName = useValidateEntityName({
    entityName: name,
  });

  const [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ] = useEditableText(isEditing, name, exitEditing, validateName, onNameSave);

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: inputTestId,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: { paddingTop: 0, paddingBottom: 0, left: -1, top: -1 },
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  return (
    <>
      {isLoading ? <Spinner size="sm" /> : icon}
      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Text
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={isEditing}
          kind="body-s"
        >
          {editableName}
        </Text>
      </Tooltip>
    </>
  );
};
