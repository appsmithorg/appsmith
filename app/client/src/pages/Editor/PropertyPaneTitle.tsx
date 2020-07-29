import React, { useState, memo, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { updateWidgetName } from "actions/propertyPaneActions";
import { AppState } from "reducers";
import Spinner from "components/ads/Spinner";
import { getExistingWidgetNames } from "sagas/selectors";
import { convertToCamelCase } from "utils/helpers";
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
  const { updating, updateError } = useSelector((state: AppState) => ({
    updating: state.ui.editor.loadingStates.updatingWidgetName,
    updateError: state.ui.editor.loadingStates.updateWidgetNameError,
  }));
  const widgets = useSelector(getExistingWidgetNames);

  const [name, setName] = useState(props.title);
  const [isEditing, setIsEditing] = useState(false);
  const updateTitle = (value: string) => {
    if (
      value &&
      value.trim().length > 0 &&
      value.trim() !== props.title.trim() &&
      props.widgetId
    ) {
      if (widgets.indexOf(value.trim()) > -1) {
        setName(props.title);
        setIsEditing(true);
      }
      dispatch(updateWidgetName(props.widgetId, value.trim()));
    }
  };
  useEffect(() => {
    if (updateError) {
      setName(props.title);
    }
  }, [updateError, props.title]);

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
      />
      {updating && <Spinner size={16} />}
    </Wrapper>
  ) : null;
});

export default PropertyPaneTitle;
