import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Colors } from "constants/Colors";

import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { isEllipsisActive, removeSpecialChars } from "utils/helpers";

import { TOOLTIP_HOVER_ON_DELAY_IN_S } from "constants/AppConstants";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ENTITY_EXPLORER_ACTION_NAME_CONFLICT_ERROR,
} from "ee/constants/messages";
import { Tooltip } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { SaveActionNameParams } from "PluginActionEditor";

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

const EditableWrapper = styled.span`
  overflow: hidden;
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  padding: ${(props) => props.theme.spaces[3] + 1}px 0;
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
  name: string;
  isEditing?: boolean;
  onChange?: (name: string) => void;
  updateEntityName: (name: string) => ReduxAction<SaveActionNameParams>;
  entityId: string;
  searchKeyword?: string;
  className?: string;
  enterEditMode: () => void;
  exitEditMode: () => void;
  nameTransformFn?: (input: string, limit?: number) => string;
  isBeta?: boolean;
}

export const EntityName = React.memo(
  forwardRef((props: EntityNameProps, ref: React.Ref<HTMLDivElement>) => {
    const { name, searchKeyword, updateEntityName } = props;
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
          return (
            searchTokenizationDelimiter + str + searchTokenizationDelimiter
          );
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
      getSavingStatusForActionName(state, props.entityId || ""),
    );

    if (!props.isEditing)
      return (
        <Container ref={ref}>
          <Tooltip
            content={updatedName}
            isDisabled={!showTooltip}
            mouseEnterDelay={TOOLTIP_HOVER_ON_DELAY_IN_S}
            placement="topLeft"
            showArrow={false}
            {...(!showTooltip ? { visible: false } : {})}
          >
            <Wrapper
              className={`${
                props.className ? props.className : ""
              } ContextMenu`}
              onDoubleClick={props.enterEditMode}
              ref={nameWrapperRef}
            >
              {searchHighlightedName}
            </Wrapper>
          </Tooltip>
        </Container>
      );

    return (
      <NameEditorComponent
        id={props.entityId}
        idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
        name={updatedName}
        onSaveName={handleUpdateName}
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
              className={`${props.className} editing`}
              defaultValue={updatedName}
              editInteractionKind={EditInteractionKind.SINGLE}
              isEditingDefault
              isInvalid={isInvalidNameForEntity}
              minimal
              onBlur={props.exitEditMode}
              onTextChanged={handleNameChange}
              placeholder="Name"
              type="text"
              valueTransform={props.nameTransformFn || removeSpecialChars}
            />
          </EditableWrapper>
        )}
      </NameEditorComponent>
    );
  }),
);

EntityName.displayName = "EntityName";

export default EntityName;
