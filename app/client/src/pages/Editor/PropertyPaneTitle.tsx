import React, { useState, memo, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { updateWidgetName } from "actions/propertyPaneActions";
import { AppState } from "reducers";
import Spinner from "components/editorComponents/Spinner";
import { getExistingWidgetNames } from "sagas/selectors";
import { convertToCamelCase } from "utils/helpers";
import { useToggleEditWidgetName } from "utils/hooks/dragResizeHooks";
const Wrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

type PropertyPaneTitleProps = {
  title: string;
  widgetId?: string;
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
  const updateTitle = useCallback(
    (value: string) => {
      if (
        value &&
        value.trim().length > 0 &&
        value.trim() !== props.title.trim() &&
        props.widgetId
      ) {
        if (widgets.indexOf(value.trim()) > -1) {
          setName(props.title);
        }
        dispatch(updateWidgetName(props.widgetId, value.trim()));
      }
    },
    [dispatch, widgets, setName, props.widgetId, props.title],
  );
  useEffect(() => {
    setName(props.title);
  }, [props.title]);

  const exitEditMode = useCallback(() => {
    props.widgetId && toggleEditWidgetName(props.widgetId, false);
  }, [toggleEditWidgetName, props.widgetId]);

  return props.widgetId ? (
    <Wrapper>
      <EditableText
        type="text"
        valueTransform={convertToCamelCase}
        defaultValue={name}
        onTextChanged={updateTitle}
        placeholder={props.title}
        updating={updating}
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={isNew}
        onBlur={exitEditMode}
      />
      {updating && <Spinner size={16} />}
    </Wrapper>
  ) : null;
});

export default PropertyPaneTitle;
