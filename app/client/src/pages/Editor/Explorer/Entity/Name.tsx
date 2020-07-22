import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { convertToCamelCase } from "utils/helpers";
import { AppState } from "reducers";
import { Page } from "constants/ReduxActionConstants";
const Wrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px;
`;

export interface EntityNameProps {
  name: string;
  isEditing?: boolean;
  onChange?: (name: string) => void;
  updateEntityName: (name: string) => void;
}

export const EntityName = (props: EntityNameProps) => {
  const { name, updateEntityName } = props;
  const dispatch = useDispatch();
  const existingPageNames: string[] = useSelector((state: AppState) =>
    state.entities.pageList.pages.map((page: Page) => page.pageName),
  );

  const existingWidgetNames: string[] = useSelector((state: AppState) =>
    Object.values(state.entities.canvasWidgets).map(
      widget => widget.widgetName,
    ),
  );

  const existingActionNames: string[] = useSelector((state: AppState) =>
    state.entities.actions.map(
      (action: { config: { name: string } }) => action.config.name,
    ),
  );

  const hasNameConflict = useCallback(
    (newName: string) =>
      !(
        existingPageNames.indexOf(newName) === -1 &&
        existingActionNames.indexOf(newName) === -1 &&
        existingWidgetNames.indexOf(newName) === -1
      ),
    [existingPageNames, existingActionNames, existingWidgetNames],
  );

  const isInvalidName = useCallback(
    (newName: string): string | boolean => {
      if (!newName || newName.trim().length === 0) {
        return "Please enter a name";
      } else if (newName !== name && hasNameConflict(newName)) {
        return `${newName} is already being used.`;
      }
      return false;
    },
    [name, hasNameConflict],
  );

  const handleAPINameChange = useCallback(
    (newName: string) => {
      if (name && newName !== name && !isInvalidName(newName)) {
        dispatch(updateEntityName(newName));
      }
    },
    [dispatch, isInvalidName, name, updateEntityName],
  );

  if (!props.isEditing) return <Wrapper>{name}</Wrapper>;
  return (
    <Wrapper>
      <EditableText
        type="text"
        defaultValue={name}
        placeholder="Name"
        onTextChanged={handleAPINameChange}
        isInvalid={isInvalidName}
        valueTransform={convertToCamelCase}
        isEditingDefault
        editInteractionKind={EditInteractionKind.SINGLE}
        minimal
      />
    </Wrapper>
  );
};

export default EntityName;
