import type { ReactElement } from "react";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import equal from "fast-deep-equal/es6";
import { useDispatch, useSelector } from "react-redux";
import {
  EditableText,
  EditInteractionKind,
  SavingState,
  TooltipComponent,
} from "design-system-old";
import { updateWidgetName } from "actions/propertyPaneActions";
import type { AppState } from "@appsmith/reducers";
import { getExistingWidgetNames } from "sagas/selectors";
import { removeSpecialChars } from "utils/helpers";
import { useToggleEditWidgetName } from "utils/hooks/dragResizeHooks";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";

import type { WidgetType } from "constants/WidgetConstants";

import { ReactComponent as BackIcon } from "assets/icons/control/back.svg";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { PopoverPosition } from "@blueprintjs/core/lib/esnext/components/popover/popoverSharedProps";
import { getIsCurrentWidgetRecentlyAdded } from "selectors/propertyPaneSelectors";

type PropertyPaneTitleProps = {
  title: string;
  widgetId?: string;
  widgetType?: WidgetType;
  updatePropertyTitle?: (title: string) => void;
  onBackClick?: () => void;
  isPanelTitle?: boolean;
  actions: Array<{
    tooltipContent: any;
    icon: ReactElement;
    tooltipPosition?: PopoverPosition;
  }>;
};

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
        <button
          className="p-1 hover:bg-warmGray-100 group t--property-pane-back-btn"
          onClick={props.onBackClick}
        >
          <BackIcon className="w-4 h-4 text-gray-500" />
        </button>
      )}
      {/* EDITABLE TEXT */}
      <div
        className="flex-grow"
        onKeyDown={handleTabKeyDown}
        style={{ maxWidth: `calc(100% - 52px)` }}
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
      </div>

      {/* ACTIONS */}
      <div className="flex items-center space-x-1">
        {props.actions.map((value, index) => (
          <TooltipComponent
            content={value.tooltipContent}
            hoverOpenDelay={200}
            key={index}
            position={value.tooltipPosition}
          >
            {value.icon}
          </TooltipComponent>
        ))}
      </div>
    </div>
  ) : null;
});
export default PropertyPaneTitle;
