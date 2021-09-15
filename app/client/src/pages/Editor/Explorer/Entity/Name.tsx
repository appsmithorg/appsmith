import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Colors } from "constants/Colors";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getExistingActionNames,
  getExistingPageNames,
  getExistingWidgetNames,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import { removeSpecialChars } from "utils/helpers";

import WidgetFactory from "utils/WidgetFactory";
const WidgetTypes = WidgetFactory.widgetTypes;

export const searchHighlightSpanClassName = "token";
export const searchTokenizationDelimiter = "!!";

const Wrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px;
  padding: 9px 0;
  line-height: 13px;
  & span.token {
    color: ${Colors.OCEAN_GREEN};
  }
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
}

export const EntityName = forwardRef(
  (props: EntityNameProps, ref: React.Ref<HTMLDivElement>) => {
    const { name, searchKeyword, updateEntityName } = props;
    const tabs:
      | Array<{ id: string; widgetId: string; label: string }>
      | undefined = useSelector((state: AppState) => {
      if (state.entities.canvasWidgets.hasOwnProperty(props.entityId)) {
        const widget = state.entities.canvasWidgets[props.entityId];
        if (
          widget.parentId &&
          state.entities.canvasWidgets.hasOwnProperty(widget.parentId)
        ) {
          const parent = state.entities.canvasWidgets[widget.parentId];
          // Todo(abhinav): abstraction leak
          if (parent.type === WidgetTypes.TABS_WIDGET) {
            return Object.values(parent.tabsObj);
          }
        }
      }
      return;
    });

    const nameUpdateError = useSelector((state: AppState) => {
      return state.ui.explorer.updateEntityError === props.entityId;
    });

    const [updatedName, setUpdatedName] = useState(name);

    useEffect(() => {
      setUpdatedName(name);
    }, [name, nameUpdateError]);

    const existingPageNames: string[] = useSelector(getExistingPageNames);
    const existingWidgetNames: string[] = useSelector(getExistingWidgetNames);

    const dispatch = useDispatch();

    const existingActionNames: string[] = useSelector(getExistingActionNames);

    const existingJSCollectionNames: string[] = useSelector((state: AppState) =>
      state.entities.jsActions.map(
        (action: { config: { name: string } }) => action.config.name,
      ),
    );

    const hasNameConflict = useCallback(
      (
        newName: string,
        tabs?: Array<{ id: string; widgetId: string; label: string }>,
      ) => {
        if (tabs === undefined) {
          return !(
            existingPageNames.indexOf(newName) === -1 &&
            existingActionNames.indexOf(newName) === -1 &&
            existingWidgetNames.indexOf(newName) === -1 &&
            existingJSCollectionNames.indexOf(newName)
          );
        } else {
          return tabs.findIndex((tab) => tab.label === newName) > -1;
        }
      },
      [
        existingPageNames,
        existingActionNames,
        existingWidgetNames,
        existingJSCollectionNames,
      ],
    );

    const isInvalidName = useCallback(
      (newName: string): string | boolean => {
        if (!newName || newName.trim().length === 0) {
          return "Please enter a name";
        } else if (newName !== name && hasNameConflict(newName, tabs)) {
          return `${newName} is already being used.`;
        }
        return false;
      },
      [name, hasNameConflict],
    );

    const handleAPINameChange = useCallback(
      (newName: string) => {
        if (name && newName !== name && !isInvalidName(newName)) {
          setUpdatedName(newName);
          dispatch(updateEntityName(newName));
        }
      },
      [dispatch, isInvalidName, name, updateEntityName],
    );

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
        <Wrapper
          className={props.className}
          onDoubleClick={props.enterEditMode}
          ref={ref}
        >
          {searchHighlightedName}
        </Wrapper>
      );
    return (
      <Wrapper>
        <EditableText
          className={`${props.className} editing`}
          defaultValue={updatedName}
          editInteractionKind={EditInteractionKind.SINGLE}
          isEditingDefault
          isInvalid={isInvalidName}
          minimal
          onBlur={props.exitEditMode}
          onTextChanged={handleAPINameChange}
          placeholder="Name"
          type="text"
          valueTransform={props.nameTransformFn || removeSpecialChars}
        />
      </Wrapper>
    );
  },
);

EntityName.displayName = "EntityName";

export default EntityName;
