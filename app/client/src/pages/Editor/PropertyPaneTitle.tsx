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
import styled from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import TooltipComponent from "components/ads/Tooltip";
import { isEqual } from "lodash";
import { Colors } from "constants/Colors";

const FixedTitle = styled.div`
  position: fixed;
  z-index: 3;
  width: ${(props) => props.theme.propertyPane.width}px;
  padding: 0px ${(props) => props.theme.spaces[5]}px;
`;

const Wrapper = styled.div<{ iconCount: number }>`
  display: grid;
  grid-template-columns: 1fr repeat(${(props) => props.iconCount}, 25px);
  justify-items: center;
  align-items: center;
  height: ${(props) => props.theme.propertyPane.titleHeight}px;
  background-color: ${Colors.GREY_1};
  & span.${BlueprintClasses.POPOVER_TARGET} {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &&& .${BlueprintClasses.EDITABLE_TEXT} {
    height: auto;
    padding: 0;
    width: 100%;
  }
  &&&
    .${BlueprintClasses.EDITABLE_TEXT_CONTENT},
    &&&
    .${BlueprintClasses.EDITABLE_TEXT_INPUT} {
    color: ${(props) => props.theme.colors.propertyPane.title};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
  }
  && svg path {
    fill: ${(props) => props.theme.colors.propertyPane.label};
  }
`;

const NameWrapper = styled.div<{ isPanelTitle?: boolean }>`
  display: ${(props) => (props.isPanelTitle ? "flex" : "block")};
  align-items: center;
  min-width: 100%;
  padding-right: 25px;
  max-width: 134px;
  &&&&&&& > * {
    overflow: hidden;
  }
`;

const StyledBackIcon = styled(ControlIcons.BACK_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  cursor: pointer;
  top: 3px;
  margin-right: 8px;
  && svg {
    width: 16px;
    height: 16px;
    path {
      fill: ${(props) => props.theme.colors.propertyPane.label};
    }
  }
`;

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
    <FixedTitle>
      <Wrapper iconCount={props.actions.length}>
        <NameWrapper isPanelTitle={props.isPanelTitle}>
          <>
            {props.isPanelTitle && (
              <StyledBackIcon
                className="t--property-pane-back-btn"
                onClick={props.onBackClick}
              />
            )}

            <EditableText
              className="t--propery-page-title"
              defaultValue={name}
              editInteractionKind={EditInteractionKind.SINGLE}
              fill
              hideEditIcon
              isEditingDefault={!props.isPanelTitle ? isNew : undefined}
              onBlur={!props.isPanelTitle ? updateTitle : undefined}
              onTextChanged={!props.isPanelTitle ? undefined : updateNewTitle}
              placeholder={props.title}
              savingState={
                updating ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              underline
              valueTransform={
                !props.isPanelTitle ? removeSpecialChars : undefined
              }
            />
          </>
        </NameWrapper>

        {props.actions.map((value, index) => (
          <TooltipComponent
            content={value.tooltipContent}
            hoverOpenDelay={200}
            key={index}
          >
            {value.icon}
          </TooltipComponent>
        ))}
      </Wrapper>
    </FixedTitle>
  ) : null;
});
export default PropertyPaneTitle;
