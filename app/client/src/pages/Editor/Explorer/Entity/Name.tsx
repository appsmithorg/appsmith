import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Colors } from "constants/Colors";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { isEllipsisActive, removeSpecialChars } from "utils/helpers";

import { TOOLTIP_HOVER_ON_DELAY_IN_S } from "constants/AppConstants";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ENTITY_EXPLORER_ACTION_NAME_CONFLICT_ERROR,
} from "@appsmith/constants/messages";
import { Tooltip } from "design-system";
import { useSelector } from "react-redux";
import { getSavingStatusForActionName } from "selectors/actionSelectors";

export const searchHighlightSpanClassName = "token";
export const searchTokenizationDelimiter = "!!";

const Container = styled.div`
  overflow: hidden;
`;

const Wrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px 0 0;
  padding: 9px 0;
  line-height: 13px;
  position: relative;
  font-size: 14px;
  & span.token {
    color: ${Colors.OCEAN_GREEN};
  }
  .beta-icon {
    position: absolute;
    top: 5px;
    right: 0;
  }
`;

const EditableWrapper = styled.div`
  overflow: hidden;
  margin: 0 ${({ theme }) => theme.spaces[1]}px;
  padding: ${({ theme }) => theme.spaces[3] + 1}px 0;
  line-height: 13px;
`;

export const replace = (
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
    <span className={className} key={`tokenize-${keyIndex}-token`}>
      {token}
    </span>,
  ].concat(replace(rest, delimiter, className, keyIndex + 1));
  return final;
};

export interface EntityNameProps {
  className?: string;
  enterEditMode: () => void;
  entityId: string;
  exitEditMode: () => void;
  isBeta?: boolean;
  isEditing?: boolean;
  name: string;
  nameTransformFn?: (input: string, limit?: number) => string;
  onChange?: (name: string) => void;
  onClick: (e: React.MouseEvent) => void;
  searchKeyword?: string;
  updateEntityName: (name: string) => void;
}
export const EntityName = React.memo((props: EntityNameProps) => {
  const {
    className,
    enterEditMode,
    entityId,
    exitEditMode,
    isEditing,
    name,
    nameTransformFn,
    onClick,
    searchKeyword,
    updateEntityName,
  } = props;

  const [updatedName, setUpdatedName] = useState(name);

  const handleUpdateName = ({ name }: { name: string }) =>
    updateEntityName(name);

  useEffect(() => {
    setUpdatedName(name);
  }, [name, setUpdatedName]);

  // Check to show tooltip on hover
  const nameWrapperRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  useEffect(() => {
    setShowTooltip(!!isEllipsisActive(nameWrapperRef.current));
  }, [updatedName, name]);

  const searchHighlightedName = useMemo(() => {
    if (searchKeyword) {
      const regex = new RegExp(searchKeyword, "gi");
      const delimited = updatedName.replace(regex, function (str) {
        return searchTokenizationDelimiter + str + searchTokenizationDelimiter;
      });

      const final = replace(
        delimited,
        searchTokenizationDelimiter,
        searchHighlightSpanClassName,
      );
      return final;
    }
    return updatedName;
  }, [searchKeyword, updatedName]);

  const saveStatus = useSelector((state) =>
    getSavingStatusForActionName(state, entityId || ""),
  );

  if (!isEditing)
    return (
      <Container onClick={onClick}>
        <Tooltip
          content={updatedName}
          isDisabled={!showTooltip}
          mouseEnterDelay={TOOLTIP_HOVER_ON_DELAY_IN_S}
          placement="topLeft"
          showArrow={false}
          {...(!showTooltip ? { visible: false } : {})}
        >
          <Wrapper
            className={`${className ? className : ""} ContextMenu`}
            onDoubleClick={enterEditMode}
            ref={nameWrapperRef}
          >
            {searchHighlightedName}
          </Wrapper>
        </Tooltip>
      </Container>
    );

  return (
    <NameEditorComponent
      dispatchAction={handleUpdateName}
      id={entityId}
      idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
      name={updatedName}
      saveStatus={saveStatus}
      suffixErrorMessage={ENTITY_EXPLORER_ACTION_NAME_CONFLICT_ERROR}
    >
      {({
        handleNameChange,
        isInvalidNameForEntity,
      }: {
        handleNameChange: (value: string) => void;
        isInvalidNameForEntity: (value: string) => string | boolean;
      }) => (
        <EditableWrapper>
          <EditableText
            className={`${className} editing`}
            defaultValue={updatedName}
            editInteractionKind={EditInteractionKind.SINGLE}
            isEditingDefault
            isInvalid={isInvalidNameForEntity}
            minimal
            onBlur={exitEditMode}
            onTextChanged={handleNameChange}
            placeholder="Name"
            type="text"
            valueTransform={nameTransformFn || removeSpecialChars}
          />
        </EditableWrapper>
      )}
    </NameEditorComponent>
  );
});

EntityName.displayName = "EntityName";

export default EntityName;
