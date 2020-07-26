import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { convertToCamelCase } from "utils/helpers";
import { AppState } from "reducers";
import { Page, ReduxActionTypes } from "constants/ReduxActionConstants";

const searchHighlightSpanClassName = "token";
const searchTokenizationDelimiter = "!!";

const Wrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px;
  & span.token {
    background: ${props => props.theme.colors.primary};
  }
`;

const replace = (
  str: string,
  delimiter: string,
  className = "token",
  keyIndex = 1,
): JSX.Element[] => {
  const occurrenceIndex = str.indexOf(delimiter);
  if (occurrenceIndex === -1)
    return [<span key={`notokenize-${keyIndex}`}>{str}</span>];
  const sliced = str.slice(occurrenceIndex + delimiter.length);
  const nextOccurenceIndex = sliced.indexOf(delimiter);
  const rest = str.slice(
    occurrenceIndex + delimiter.length + nextOccurenceIndex + delimiter.length,
  );
  const token = str.slice(
    occurrenceIndex + delimiter.length,
    occurrenceIndex + delimiter.length + nextOccurenceIndex,
  );
  const final = [
    <span key={`tokenize-${keyIndex}`}>{str.slice(0, occurrenceIndex)}</span>,
    <span key={`tokenize-${keyIndex}-token`} className={className}>
      {token}
    </span>,
  ].concat(replace(rest, delimiter, className, keyIndex + 1));
  return final;
};

export interface EntityNameProps {
  name: string;
  isEditing?: boolean;
  onChange?: (name: string) => void;
  updateEntityName: (name: string) => void;
  entityId: string;
  searchKeyword?: string;
}

export const EntityName = (props: EntityNameProps) => {
  const { name, updateEntityName, searchKeyword } = props;
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

  const searchHighlightedName = useMemo(() => {
    if (searchKeyword) {
      const regex = new RegExp(searchKeyword, "gi");
      const delimited = name.replace(regex, function(str) {
        return searchTokenizationDelimiter + str + searchTokenizationDelimiter;
      });

      const final = replace(
        delimited,
        searchTokenizationDelimiter,
        searchHighlightSpanClassName,
      );
      return final;
    }
    return name;
  }, [searchKeyword, name]);

  const exitEditMode = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
    });
  }, [dispatch]);

  const enterEditMode = useCallback(
    () =>
      props.updateEntityName &&
      dispatch({
        type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
        payload: {
          id: props.entityId,
        },
      }),
    [dispatch, props.entityId, props.updateEntityName],
  );

  if (!props.isEditing)
    return (
      <Wrapper onDoubleClick={enterEditMode}>{searchHighlightedName}</Wrapper>
    );
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
        onBlur={exitEditMode}
      />
    </Wrapper>
  );
};

export default EntityName;
