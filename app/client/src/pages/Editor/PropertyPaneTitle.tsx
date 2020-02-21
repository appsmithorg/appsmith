import React, { useState, memo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import EditableText from "components/editorComponents/EditableText";
import { updateWidgetName } from "actions/propertyPaneActions";
import { AppState } from "reducers";
import Spinner from "components/editorComponents/Spinner";
import { getExistingWidgetNames } from "sagas/selectors";
const Wrapper = styled.div`
  display: inline-flex;
  justify-content: space-around;
  align-items: center;
`;

type PropertyPaneTitleProps = {
  title: string;
  widgetId?: string;
};

/* eslint-disable react/display-name */
const PropertyPaneTitle = memo((props: PropertyPaneTitleProps) => {
  const dispatch = useDispatch();
  const updating = useSelector(
    (state: AppState) => state.ui.editor.loadingStates.updatingWidgetName,
  );

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
  const textChanged = (value: string) => {
    setName(value.replace(/\W+/, "_").slice(0, 30));
  };

  return props.widgetId ? (
    <Wrapper>
      <EditableText
        type="text"
        defaultValue={name}
        onTextChanged={updateTitle}
        onChange={textChanged}
        isEditing={isEditing}
        placeholder={props.title}
        value={name}
      />
      {updating && <Spinner size={16} />}
    </Wrapper>
  ) : null;
});

export default PropertyPaneTitle;
