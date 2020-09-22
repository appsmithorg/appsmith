import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Icon, Tooltip, Position } from "@blueprintjs/core";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { WidgetType } from "constants/WidgetConstants";
import { BindingText } from "pages/Editor/APIEditor/Form";
import { theme } from "constants/DefaultTheme";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledToolTip = styled(Tooltip)`
  position: absolute;
  top: 0;
  right: 35px;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
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
      <StyledToolTip
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
      </StyledToolTip>

      <CloseButton
        onClick={(e: any) => {
          AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
            widgetType: props.widgetType || "",
            widgetId: props.widgetId,
          });
          props.onClose();
          e.preventDefault();
          e.stopPropagation();
        }}
        size={theme.spaces[5]}
        color={theme.colors.paneSectionLabel}
        className={"t--property-pane-close-btn"}
      />
    </Wrapper>
  );
};

export default PropertyTitleEditor;
