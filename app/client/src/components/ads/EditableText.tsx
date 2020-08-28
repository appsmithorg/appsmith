import React, { useState, useEffect, useMemo, useCallback } from "react";
import { EditableText as BlueprintEditableText } from "@blueprintjs/core";
import styled from "styled-components";
import { Size } from "./Button";
import Text, { TextType } from "./Text";
import Spinner from "./Spinner";
import { hexToRgba } from "./common";
import { theme } from "constants/DefaultTheme";
import { noop } from "lodash";
import Icon from "./Icon";

export enum EditInteractionKind {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
}

export type SavingStateHandler = (
  isSaving: boolean,
  state?: SavingState,
) => void;

export enum SavingState {
  NOT_STARTED = "NOT_STARTED",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

type EditableTextProps = {
  defaultValue: string;
  onTextChanged: (value: string) => void;
  placeholder: string;
  className?: string;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  isInvalid?: (value: string) => string | boolean;
  editInteractionKind: EditInteractionKind;
  hideEditIcon?: boolean;
  fill?: boolean;
  onSubmit: (
    value: string,
    callback: SavingStateHandler,
  ) => { saving: SavingState };
};

const EditableTextWrapper = styled.div<{
  fill?: boolean;
}>`
  width: ${props => (!props.fill ? "234px" : "100%")};
  .error-message {
    margin-left: ${props => props.theme.spaces[5]}px;
    color: ${props => props.theme.colors.danger.main};
  }
`;

const editModeBgcolor = (
  isInvalid: boolean,
  isEditing: boolean,
  savingState: { isSaving: boolean; name?: SavingState },
): string => {
  if (
    (isInvalid && isEditing) ||
    (!savingState.isSaving && savingState.name === SavingState.ERROR)
  ) {
    return hexToRgba(theme.colors.danger.main, 0.08);
  } else if (!isInvalid && isEditing) {
    return theme.colors.blackShades[2];
  } else {
    return "transparent";
  }
};

const TextContainer = styled.div<{
  isInvalid: boolean;
  isEditing: boolean;
  bgColor: string;
}>`
  display: flex;
  align-items: center;
  ${props =>
    props.isEditing && props.isInvalid
      ? `margin-bottom: ${props.theme.spaces[2]}px`
      : null};
  .bp3-editable-text.bp3-editable-text-editing::before,
  .bp3-editable-text.bp3-disabled::before {
    display: none;
  }

  &&& .bp3-editable-text-content,
  &&& .bp3-editable-text-input {
    font-size: ${props => props.theme.typography.p1.fontSize}px;
    line-height: ${props => props.theme.typography.p1.lineHeight}px;
    letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
    font-weight: ${props => props.theme.typography.p1.fontWeight}px;
  }

  & .bp3-editable-text-content {
    cursor: pointer;
    color: ${props => props.theme.colors.blackShades[9]};
    overflow: hidden;
    text-overflow: ellipsis;
    ${props => (props.isEditing ? "display: none" : "display: block")};
  }

  & .bp3-editable-text-input {
    border: none;
    outline: none;
    height: ${props => props.theme.spaces[13] + 3}px;
    padding: ${props => props.theme.spaces[0]}px;
    color: ${props => props.theme.colors.blackShades[9]};
    min-width: 100%;
    border-radius: ${props => props.theme.spaces[0]}px;
  }

  & .bp3-editable-text {
    overflow: hidden;
    padding: ${props => props.theme.spaces[4]}px
      ${props => props.theme.spaces[5]}px;
    width: calc(100% - 40px);
    background-color: ${props => props.bgColor};
  }

  .icon-wrapper {
    background-color: ${props => props.bgColor};
  }
`;

const IconWrapper = styled.div`
  width: ${props => props.theme.spaces[13] + 4}px;
  padding-right: ${props => props.theme.spaces[5]}px;
  height: ${props => props.theme.spaces[13] + 3}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const EditableText = (props: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(!!props.isEditingDefault);
  const [value, setValue] = useState(props.defaultValue);
  const [lastValidValue, setLastValidValue] = useState(props.defaultValue);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [changeStarted, setChangeStarted] = useState<boolean>(false);
  const [savingState, setSavingState] = useState<{
    isSaving: boolean;
    name?: SavingState;
  }>({ isSaving: false, name: SavingState.NOT_STARTED });

  useEffect(() => {
    setValue(props.defaultValue);
    setIsEditing(!!props.isEditingDefault);
  }, [props.defaultValue, props.isEditingDefault]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(props.defaultValue);
  }, [props.forceDefault, props.defaultValue]);

  const bgColor = useMemo(
    () => editModeBgcolor(!!isInvalid, isEditing, savingState),
    [isInvalid, isEditing, savingState],
  );

  const editMode = useCallback((e: React.MouseEvent) => {
    setIsEditing(true);
    const errorMessage = props.isInvalid && props.isInvalid(props.defaultValue);
    setIsInvalid(errorMessage ? errorMessage : false);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onConfirm = (_value: string) => {
    if (
      (!savingState.isSaving && savingState.name === SavingState.ERROR) ||
      isInvalid
    ) {
      setValue(lastValidValue);
      setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
    } else if (changeStarted) {
      props.onTextChanged(_value);
      props.onSubmit(_value, SavingStateHandler);
    }
    setIsEditing(false);
    setChangeStarted(false);
  };

  const onInputchange = useCallback((_value: string) => {
    let finalVal: string = _value;
    if (props.valueTransform) {
      finalVal = props.valueTransform(_value);
    }
    setValue(finalVal);

    const errorMessage = props.isInvalid && props.isInvalid(finalVal);
    const error = errorMessage ? errorMessage : false;
    if (!error) {
      setLastValidValue(finalVal);
    }
    setIsInvalid(error);
    setChangeStarted(true);
  }, []);

  const SavingStateHandler = (isSaving: boolean, state?: SavingState) => {
    setIsEditing(false);
    if (isSaving) {
      setSavingState({ isSaving: true });
    } else {
      switch (state) {
        case SavingState.SUCCESS:
          setSavingState({ isSaving: false, name: SavingState.SUCCESS });
          break;
        default:
          setValue(props.defaultValue);
          setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
          break;
      }
    }
  };

  const iconName =
    !isEditing && savingState.name === SavingState.NOT_STARTED
      ? "edit"
      : !isEditing && savingState.name === SavingState.SUCCESS
      ? "success"
      : (isEditing && savingState.name === SavingState.ERROR) ||
        (isEditing && !!isInvalid)
      ? "error"
      : undefined;

  const nonEditMode = () => {
    if (
      !isEditing &&
      !savingState.isSaving &&
      savingState.name === SavingState.SUCCESS
    ) {
      setSavingState({ isSaving: false, name: SavingState.NOT_STARTED });
    }
  };

  return (
    <EditableTextWrapper
      fill={props.fill}
      onMouseEnter={nonEditMode}
      onDoubleClick={
        props.editInteractionKind === EditInteractionKind.DOUBLE
          ? editMode
          : noop
      }
      onClick={
        props.editInteractionKind === EditInteractionKind.SINGLE
          ? editMode
          : noop
      }
    >
      <TextContainer
        isInvalid={!!isInvalid}
        isEditing={isEditing}
        bgColor={bgColor}
      >
        <BlueprintEditableText
          disabled={!isEditing}
          isEditing={isEditing}
          onChange={onInputchange}
          onConfirm={onConfirm}
          value={value}
          selectAllOnFocus
          placeholder={props.placeholder}
          className={props.className}
          onCancel={onConfirm}
        />

        <IconWrapper className="icon-wrapper">
          {savingState.isSaving ? (
            <Spinner size={Size.large} />
          ) : (
            <Icon name={iconName} size={Size.large} />
          )}
        </IconWrapper>
      </TextContainer>
      {isEditing && !!isInvalid ? (
        <Text type={TextType.P2} className="error-message">
          {isInvalid}
        </Text>
      ) : null}
    </EditableTextWrapper>
  );
};

EditableText.defaultProps = {
  fill: false,
};

export default EditableText;
