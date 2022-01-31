import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import TooltipComponent from "components/ads/Tooltip";
import { Colors } from "constants/Colors";
import get from "lodash/get";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Classes, Position } from "@blueprintjs/core";
import { AppState } from "reducers";
import styled from "styled-components";
import { isEllipsisActive, removeSpecialChars } from "utils/helpers";

import WidgetFactory from "utils/WidgetFactory";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { ReactComponent as BetaIcon } from "assets/icons/menu/beta.svg";
import { getCurrentPageId } from "selectors/editorSelectors";

const WidgetTypes = WidgetFactory.widgetTypes;

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
    const currentPageId = useSelector(getCurrentPageId);
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
      return (
        get(state, "ui.explorer.entity.updateEntityError") === props.entityId
      );
    });
    const targetRef = useRef<HTMLDivElement | null>(null);

    const [updatedName, setUpdatedName] = useState(name);

    useEffect(() => {
      setUpdatedName(name);
    }, [name, nameUpdateError]);

    const dispatch = useDispatch();

    const store = useStore();

    const hasNameConflict = useCallback(
      (
        newName: string,
        tabs?: Array<{ id: string; widgetId: string; label: string }>,
      ) => {
        if (tabs === undefined) {
          const state: AppState = store.getState();
          const existingPageNames = state.entities.pageList.pages.map(
            (page) => page.pageName,
          );
          const existingActionNames = state.entities.actions
            .filter(
              (action) =>
                action.config.id !== props.entityId &&
                action.config.pageId === currentPageId,
            )
            .map((action) => action.config.name);
          const existingJSCollectionNames = state.entities.jsActions
            .filter((jsAction) => {
              return (
                jsAction.config.id !== props.entityId &&
                jsAction.config.pageId === currentPageId
              );
            })
            .map((jsAction) => jsAction.config.name);
          const existingWidgetNames = Object.values(
            state.entities.canvasWidgets,
          ).map((widget) => widget.widgetName);
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
      [],
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
      <EditableWrapper>
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
      </EditableWrapper>
    );
  }),
);

EntityName.displayName = "EntityName";

export default EntityName;
