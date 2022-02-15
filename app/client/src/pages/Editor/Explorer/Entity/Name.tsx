import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import TooltipComponent from "components/ads/Tooltip";
import { Colors } from "constants/Colors";

import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Classes, Position } from "@blueprintjs/core";
import styled from "styled-components";
import { isEllipsisActive, removeSpecialChars } from "utils/helpers";

import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { ReactComponent as BetaIcon } from "assets/icons/menu/beta.svg";
import NameEditorComponent from "components/utils/NameEditorComponent";
import { ENTITY_EXPLORER_ACTION_NAME_CONFLICT_ERROR } from "@appsmith/constants/messages";

export const searchHighlightSpanClassName = "token";
export const searchTokenizationDelimiter = "!!";

const Container = styled.div`
  .${Classes.POPOVER_TARGET} {
    display: initial;
  }
  overflow: hidden;
`;

const Wrapper = styled.div`
  .${Classes.POPOVER_TARGET} {
    display: initial;
  }
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px 0 0;
  padding: 9px 0;
  line-height: 13px;
  position: relative;
  font-weight: 500;
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
  updateEntityName: (name: string) => void;
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

    const targetRef = useRef<HTMLDivElement | null>(null);

    const handleUpdateName = ({ name }: { name: string }) =>
      updateEntityName(name);

    useEffect(() => {
      setUpdatedName(name);
    }, [name, setUpdatedName]);

    const searchHighlightedName = useMemo(() => {
      if (searchKeyword) {
        const regex = new RegExp(searchKeyword, "gi");
        const delimited = updatedName.replace(regex, function(str) {
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

    if (!props.isEditing)
      return (
        <Container ref={ref}>
          <TooltipComponent
            boundary={"viewport"}
            content={updatedName}
            disabled={!isEllipsisActive(targetRef.current)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            modifiers={{ arrow: { enabled: false } }}
            position={Position.TOP_LEFT}
          >
            <Wrapper
              className={`${
                props.className ? props.className : ""
              } ContextMenu`}
              data-guided-tour-iid={name}
              onDoubleClick={props.enterEditMode}
              ref={targetRef}
            >
              {searchHighlightedName}
              {props.isBeta ? <BetaIcon className="beta-icon" /> : ""}
            </Wrapper>
          </TooltipComponent>
        </Container>
      );

    return (
      <NameEditorComponent
        currentActionConfig={{ id: props.entityId, name: updatedName }}
        dispatchAction={handleUpdateName}
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
