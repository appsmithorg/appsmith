import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Button } from "design-system";

export interface ValidateProps {
  value: string;
  id: string;
}

export interface LabelFieldProps {
  name: string;
  onDeleteClick: () => void;
  validate?: (props: ValidateProps) => { error?: string };
  id: string;
}

const DELETE_BUTTON_WIDTH = 34;

const StyledWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  // hardcoding this value to the max size of the EditableText to avoid vertical jitter
  height: 36px;

  & > div {
    width: calc(100% - ${DELETE_BUTTON_WIDTH}px) !important;
  }

  & > div > div > div {
    width: 100%;
  }
`;

const StyledEditableText = styled(EditableText)`
  width: 100% !important;
`;

function FieldLabel({ id, name, onDeleteClick, validate }: LabelFieldProps) {
  const [editIconHidden, setEditIconHidden] = useState(true);

  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });

  const isInvalid = useCallback(
    (value: string) => {
      const { error } = validate?.({ value, id }) || {};

      if (error) {
        return error;
      } else {
        return false;
      }
    },
    [validate, id],
  );

  const hideEditIcon = () => setEditIconHidden(true);
  const showEditIcon = () => setEditIconHidden(false);

  return (
    <StyledWrapper>
      <div onMouseEnter={showEditIcon} onMouseLeave={hideEditIcon}>
        <StyledEditableText
          defaultValue={value}
          editInteractionKind={EditInteractionKind.SINGLE}
          hideEditIcon={editIconHidden}
          isInvalid={isInvalid}
          onBlur={onBlur}
          onTextChanged={onChange}
          placeholder=""
          type="text"
        />
      </div>
      <Button
        data-testid="t--delete-input-btn"
        kind="tertiary"
        onClick={onDeleteClick}
        startIcon="trash"
      />
    </StyledWrapper>
  );
}

export default FieldLabel;
