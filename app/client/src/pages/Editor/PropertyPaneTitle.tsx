import React, { memo, useCallback, useEffect, useRef, useState } from "react";
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
import AnalyticsUtil from "utils/AnalyticsUtil";
import { BindingText } from "pages/Editor/APIEditor/Form";

import { Classes, Icon, Position, Tooltip } from "@blueprintjs/core";
import { WidgetType } from "constants/WidgetConstants";
import styled, { theme } from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import { copyWidget, deleteSelectedWidget } from "actions/widgetActions";
import { AnyStyledComponent } from "styled-components";
import { Classes as BlueprintClasses } from "@blueprintjs/core";

const CopyIcon = ControlIcons.COPY_CONTROL;
const DeleteIcon = FormIcons.DELETE_ICON;
const Wrapper = styled.div<{ isPanelTitle?: boolean }>`
  justify-content: center;
  align-items: center;
  display: grid;
  width: 100%;
  grid-template-columns: ${(props) =>
    props.isPanelTitle ? "1fr 25px 25px" : "1fr 25px 25px 25px 25px"};
  justify-items: center;
  align-items: center;
  justify-content: stretch;
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: ${(props) => props.theme.colors.propertyPane.bg};
  margin-top: -1px;
  border-bottom: 1px solid
    ${(props) => props.theme.colors.propertyPane.zoomButtonBG};
  padding-top: ${(props) => `${props.theme.spaces[1] + 1}px`};
  padding-bottom: ${(props) => `${props.theme.spaces[5]}px`};

  & span.${Classes.POPOVER_TARGET} {
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
  onClose: () => void;
  updatePropertyTitle?: (title: string) => void;
  onBackClick?: () => void;
  hideCopyIcon?: boolean;
  hideDeleteIcon?: boolean;
  hideHelpIcon?: boolean;
  hideCloseIcon?: boolean;
  isPanelTitle?: boolean;
};

/* eslint-disable react/display-name */
const PropertyPaneTitle = memo((props: PropertyPaneTitleProps) => {
  const dispatch = useDispatch();
  const { updating } = useSelector((state: AppState) => ({
    updating: state.ui.editor.loadingStates.updatingWidgetName,
  }));
  const isNew = useSelector((state: AppState) => state.ui.propertyPane.isNew);
  const widgets = useSelector(getExistingWidgetNames);
  const toggleEditWidgetName = useToggleEditWidgetName();
  const [name, setName] = useState(props.title);
  const valueRef = useRef("");

  // Update Property Title State
  const { title, updatePropertyTitle } = props;
  const updateNewTitle = useCallback(
    (value: string) => {
      if (value && value.trim().length > 0 && value.trim() !== title.trim()) {
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

  const handleDelete = useCallback(
    () => dispatch(deleteSelectedWidget(false)),
    [dispatch],
  );
  const handleCopy = useCallback(() => dispatch(copyWidget(false)), [dispatch]);

  return props.widgetId || props.isPanelTitle ? (
    <Wrapper isPanelTitle={props.isPanelTitle}>
      <NameWrapper isPanelTitle={props.isPanelTitle}>
        <>
          {props.isPanelTitle && (
            <StyledBackIcon
              onClick={props.onBackClick}
              className="t--property-pane-back-btn"
            />
          )}

          <EditableText
            valueTransform={removeSpecialChars}
            defaultValue={name}
            placeholder={props.title}
            editInteractionKind={EditInteractionKind.SINGLE}
            isEditingDefault={!props.isPanelTitle ? isNew : undefined}
            onBlur={!props.isPanelTitle ? updateTitle : undefined}
            onTextChanged={!props.isPanelTitle ? undefined : updateNewTitle}
            hideEditIcon
            className="t--propery-page-title"
            savingState={
              updating ? SavingState.STARTED : SavingState.NOT_STARTED
            }
            fill
            underline
          />
        </>
      </NameWrapper>

      {!props.hideCopyIcon && (
        <Tooltip
          content="Copy Widget"
          position={Position.TOP}
          hoverOpenDelay={200}
        >
          <CopyIcon
            className="t--copy-widget"
            width={14}
            height={14}
            color={theme.colors.paneSectionLabel}
            onClick={handleCopy}
          />
        </Tooltip>
      )}

      {!props.hideDeleteIcon && (
        <Tooltip
          content="Delete Widget"
          position={Position.TOP}
          hoverOpenDelay={200}
        >
          <DeleteIcon
            className="t--delete-widget"
            width={16}
            height={16}
            color={theme.colors.paneSectionLabel}
            onClick={handleDelete}
          />
        </Tooltip>
      )}

      {!props.hideHelpIcon && (
        <Tooltip
          content={
            <div>
              <span>You can connect data from your API by adding </span>
              <BindingText>{`{{apiName.data}}`}</BindingText>
              <span> to a widget property</span>
            </div>
          }
          position={Position.TOP}
          hoverOpenDelay={200}
          boundary="window"
        >
          <Icon
            color={theme.colors.paneSectionLabel}
            icon="help"
            iconSize={16}
          />
        </Tooltip>
      )}
      {!props.hideCloseIcon && (
        <Tooltip content="Close" position={Position.TOP} hoverOpenDelay={200}>
          <Icon
            onClick={(e: any) => {
              AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
                widgetType: props.widgetType || "",
                widgetId: props.widgetId,
              });
              props.onClose();
              e.preventDefault();
              e.stopPropagation();
            }}
            iconSize={16}
            color={theme.colors.paneSectionLabel}
            icon="cross"
            className={"t--property-pane-close-btn"}
          />
        </Tooltip>
      )}
    </Wrapper>
  ) : null;
});

export default PropertyPaneTitle;
