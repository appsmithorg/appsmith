import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Icon, Tooltip, Position, Classes } from "@blueprintjs/core";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { WidgetType } from "constants/WidgetConstants";
import { BindingText } from "pages/Editor/APIEditor/Form";
import { theme } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Wrapper = styled.div`
  justify-content: center;
  align-items: center;
  display: grid;
  width: 100%;
  grid-template-columns: 171px 25px 25px 25px;
  justify-items: center;
  align-items: center;
  justify-content: stretch;
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: ${props => props.theme.colors.paneBG};
  & span.${Classes.POPOVER_TARGET} {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export type PropertyTitleEditorProps = {
  title: string;
  widgetId?: string;
  updatePropertyTitle: (title: string) => void;
  widgetType?: WidgetType;
  onClose: () => void;
};

/* eslint-disable react/display-name */
const PropertyTitleEditor = (props: PropertyTitleEditorProps) => {
  const { title, updatePropertyTitle } = props;
  const [name, setName] = useState(props.title);
  const [updating, toggleUpdating] = useState(false);
  const updateTitle = useCallback(
    (value: string) => {
      if (value && value.trim().length > 0 && value.trim() !== title.trim()) {
        updatePropertyTitle(value.trim());
      }
    },
    [updatePropertyTitle, title],
  );
  const exitEditMode = () => {
    toggleUpdating(true);
  };
  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  return (
    <Wrapper>
      <EditableText
        type="text"
        defaultValue={name}
        onTextChanged={updateTitle}
        placeholder={props.title}
        updating={updating}
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={false}
        onBlur={exitEditMode}
      />
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
      >
        <Icon
          style={{
            // position: "absolute",
            // right: 35,
            padding: 7,
          }}
          color={theme.colors.paneSectionLabel}
          icon="help"
        />
      </Tooltip>
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
    </Wrapper>
  );
};

export default PropertyTitleEditor;
