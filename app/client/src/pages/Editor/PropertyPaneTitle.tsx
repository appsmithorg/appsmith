import React, {
  memo,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import EditableText, {
  EditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { updateWidgetName } from "actions/propertyPaneActions";
import { AppState } from "reducers";
import { getExistingWidgetNames } from "sagas/selectors";
import { removeSpecialChars } from "utils/helpers";
import { useToggleEditWidgetName } from "utils/hooks/dragResizeHooks";

import { WidgetType } from "constants/WidgetConstants";
import TooltipComponent from "components/ads/Tooltip";
import { isEqual } from "lodash";

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
  }>;
};

/* eslint-disable react/display-name */
const PropertyPaneTitle = memo(function PropertyPaneTitle(
  props: PropertyPaneTitleProps,
) {
  const dispatch = useDispatch();
  const updating = useSelector(
    (state: AppState) => state.ui.editor.loadingStates.updatingWidgetName,
  );
  const isNew = useSelector((state: AppState) => state.ui.propertyPane.isNew);

  // Pass custom equality check function. Shouldn't be expensive than the render
  // as it is just a small array #perf
  const widgets = useSelector(getExistingWidgetNames, isEqual);
  const toggleEditWidgetName = useToggleEditWidgetName();
  const [name, setName] = useState(props.title);
  const valueRef = useRef("");

  // Update Property Title State
  const { title, updatePropertyTitle } = props;
  const updateNewTitle = useCallback(
    (value: string) => {
      if (
        value &&
        value.trim().length > 0 &&
        value.trim() !== (title && title.trim())
      ) {
        updatePropertyTitle && updatePropertyTitle(value.trim());
      }
    },
    [updatePropertyTitle, title],
  );
  // End

  const updateTitle = useCallback(
    (value?: string) => {
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
    [dispatch, widgets, setName, props.widgetId, props.title],
  );

  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  return props.widgetId || props.isPanelTitle ? (
    <div className="flex items-center w-full px-3 z-3">
      <div className="flex-grow">
        {props.isPanelTitle && (
          <div
            className="t--property-pane-back-btn"
            onClick={props.onBackClick}
          />
        )}

        <EditableText
          className="flex-grow text-lg font-semibold t--propery-page-title"
          defaultValue={name}
          editInteractionKind={EditInteractionKind.SINGLE}
          fill
          hideEditIcon
          isEditingDefault={!props.isPanelTitle ? isNew : undefined}
          onBlur={!props.isPanelTitle ? updateTitle : undefined}
          onTextChanged={!props.isPanelTitle ? undefined : updateNewTitle}
          placeholder={props.title}
          savingState={updating ? SavingState.STARTED : SavingState.NOT_STARTED}
          underline
          valueTransform={!props.isPanelTitle ? removeSpecialChars : undefined}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex items-center">
        {props.actions.map((value, index) => (
          <TooltipComponent
            content={value.tooltipContent}
            hoverOpenDelay={200}
            key={index}
          >
            {value.icon}
          </TooltipComponent>
        ))}
      </div>
    </div>
  ) : null;
});
export default PropertyPaneTitle;
