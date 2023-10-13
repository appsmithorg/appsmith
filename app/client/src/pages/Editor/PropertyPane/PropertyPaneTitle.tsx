import type { ReactElement } from "react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import {
  EditableText,
  EditInteractionKind,
  SavingState,
} from "design-system-old";
import type { TooltipPlacement } from "design-system";
import { Tooltip, Button } from "design-system";
import { updateWidgetName } from "actions/propertyPaneActions";
import type { AppState } from "@appsmith/reducers";
import { getExistingWidgetNames } from "sagas/selectors";
import { removeSpecialChars } from "utils/helpers";
import { useToggleEditWidgetName } from "utils/hooks/dragResizeHooks";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";

import type { WidgetType } from "constants/WidgetConstants";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getIsCurrentWidgetRecentlyAdded } from "selectors/propertyPaneSelectors";

interface PropertyPaneTitleProps {
  title: string;
  widgetId?: string;
  widgetType?: WidgetType;
  updatePropertyTitle?: (title: string) => void;
  onBackClick?: () => void;
  isPanelTitle?: boolean;
  actions: Array<{
    tooltipContent: any;
    icon: ReactElement;
    tooltipPosition?: TooltipPlacement;
  }>;
}

const StyledEditableContainer = styled.div`
  max-width: calc(100% - 52px);
  flex-grow: 1;
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid transparent;

  :focus-within {
    /* outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline); */
    border-color: var(--ads-v2-color-border-emphasis-plus);
  }
`;

/* eslint-disable react/display-name */
const PropertyPaneTitle = memo(function PropertyPaneTitle(
  props: PropertyPaneTitleProps,
) {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const updating = useSelector(
    (state: AppState) => state.ui.editor.loadingStates.updatingWidgetName,
  );
  const isCurrentWidgetRecentlyAdded = useSelector(
    getIsCurrentWidgetRecentlyAdded,
  );
  const guidedTourEnabled = useSelector(inGuidedTour);

  const { dispatchInteractionAnalyticsEvent, eventEmitterRef } =
    useInteractionAnalyticsEvent<HTMLDivElement>();

  // Pass custom equality check function. Shouldn't be expensive than the render
  // as it is just a small array #perf
  const widgets = useSelector(getExistingWidgetNames, equal);
  const toggleEditWidgetName = useToggleEditWidgetName();
  const [name, setName] = useState(props.title);
  const valueRef = useRef("");

  // Update Property Title State
  const { title, updatePropertyTitle } = props;
  const updateNewTitle = useCallback(
    (value: string) => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }

      if (
        value &&
        value.trim().length > 0 &&
        value.trim() !== (title && title.trim())
      ) {
        updatePropertyTitle && updatePropertyTitle(value.trim());
      }
    },
    [updatePropertyTitle, title, guidedTourEnabled],
  );
  // End

  const updateTitle = useCallback(
    (value?: string) => {
      if (guidedTourEnabled) {
        dispatch(toggleShowDeviationDialog(true));
        return;
      }
      if (
        value &&
        value.trim().length > 0 &&
        value.trim() !== props.title.trim() &&
        valueRef.current !== value.trim() &&
        props.widgetId
      ) {
        valueRef.current = value.trim();
        if (widgets.indexOf(value.trim()) > -1) {
          setName(props.title);
        }
        dispatch(updateWidgetName(props.widgetId, value.trim()));
        toggleEditWidgetName(props.widgetId, false);
      }
    },
    [
      dispatch,
      widgets,
      setName,
      props.widgetId,
      props.title,
      guidedTourEnabled,
    ],
  );

  useEffect(() => {
    if (props.isPanelTitle) return;
    if (isCurrentWidgetRecentlyAdded) {
      containerRef.current?.focus();
    }

    return () => {
      dispatch({
        type: ReduxActionTypes.REMOVE_FROM_RECENTLY_ADDED_WIDGET,
        payload: props.widgetId,
      });
    };
  }, []);

  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  // Focus title on F2
  const [isEditingDefault, setIsEditingDefault] = useState(
    !props.isPanelTitle ? isCurrentWidgetRecentlyAdded : undefined,
  );

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "F2") {
      setIsEditingDefault(true);
    }
  }

  function handleOnBlurEverytime() {
    setIsEditingDefault(false);
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleTabKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab")
      dispatchInteractionAnalyticsEvent({
        key: e.key,
        propertyType: "LABEL",
        propertyName: "widgetName",
        widgetType: props.widgetType,
      });
  }

  return props.widgetId || props.isPanelTitle ? (
    <div
      className="flex items-center w-full px-4 py-3 space-x-1 fixed bg-white z-3"
      ref={eventEmitterRef}
    >
      {/* BACK BUTTON */}
      {props.isPanelTitle && (
        <Button
          data-testid="t--property-pane-back-btn"
          isIconButton
          kind="tertiary"
          onClick={props.onBackClick}
          startIcon="back-control"
        />
      )}
      {/* EDITABLE TEXT */}
      <StyledEditableContainer
        className="flex-grow"
        onKeyDown={handleTabKeyDown}
      >
        <EditableText
          className="flex-grow text-lg font-semibold t--property-pane-title"
          defaultValue={name}
          editInteractionKind={EditInteractionKind.SINGLE}
          fill
          hideEditIcon
          isEditingDefault={isEditingDefault}
          onBlur={!props.isPanelTitle ? updateTitle : undefined}
          onBlurEverytime={handleOnBlurEverytime}
          onTextChanged={!props.isPanelTitle ? undefined : updateNewTitle}
          placeholder={props.title}
          savingState={updating ? SavingState.STARTED : SavingState.NOT_STARTED}
          underline
          valueTransform={!props.isPanelTitle ? removeSpecialChars : undefined}
          wrapperRef={containerRef}
        />
      </StyledEditableContainer>

      {/* ACTIONS */}
      <div className="flex items-center space-x-1">
        {props.actions.map((value, index) => (
          <Tooltip
            content={value.tooltipContent}
            key={index}
            placement={value.tooltipPosition}
          >
            {value.icon}
          </Tooltip>
        ))}
      </div>
    </div>
  ) : null;
});
export default PropertyPaneTitle;
