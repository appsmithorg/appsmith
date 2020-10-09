import React, { useState, useEffect, useMemo, useCallback } from "react";
import { EditableText as BlueprintEditableText } from "@blueprintjs/core";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import Spinner from "./Spinner";
import { Classes, CommonComponentProps } from "./common";
import { noop } from "lodash";
import Icon, { IconSize } from "./Icon";
import { getThemeDetails } from "selectors/themeSelectors";
import { useSelector } from "react-redux";

export enum EditInteractionKind {
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
}

export enum SavingState {
  STARTED = "STARTED",
  NOT_STARTED = "NOT_STARTED",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

type EditableTextProps = CommonComponentProps & {
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
  savingState: SavingState;
  onBlur: (value: string) => void;
};

const EditableTextWrapper = styled.div<{
  fill?: boolean;
}>`
  width: ${props => (!props.fill ? "234px" : "100%")};
  .${Classes.TEXT} {
    margin-left: ${props => props.theme.spaces[5]}px;
    color: ${props => props.theme.colors.danger.main};
  }
`;

const editModeBgcolor = (
  isInvalid: boolean,
  isEditing: boolean,
  savingState: SavingState,
  theme: any,
): string => {
  if ((isInvalid && isEditing) || savingState === SavingState.ERROR) {
    return theme.colors.editableText.dangerBg;
  } else if (!isInvalid && isEditing) {
    return theme.colors.editableText.bg;
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

  &&& .bp3-editable-text-content {
    cursor: pointer;
    color: ${props => props.theme.colors.editableText.color};
    overflow: hidden;
    text-overflow: ellipsis;
    ${props => (props.isEditing ? "display: none" : "display: block")};
  }

  &&& .bp3-editable-text-input {
    border: none;
    outline: none;
    height: ${props => props.theme.spaces[13] + 3}px;
    color: ${props => props.theme.colors.editableText.color};
    min-width: 100%;
    border-radius: ${props => props.theme.spaces[0]}px;
  }

  &&& .bp3-editable-text {
    overflow: hidden;
    height: ${props => props.theme.spaces[13] + 3}px;
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
  const {
    onBlur,
    onTextChanged,
    isInvalid: inputValidation,
    defaultValue,
    isEditingDefault,
  } = props;
  const [isEditing, setIsEditing] = useState(!!isEditingDefault);
  const [value, setValue] = useState(defaultValue);
  const [lastValidValue, setLastValidValue] = useState(defaultValue);
  const [isInvalid, setIsInvalid] = useState<string | boolean>(false);
  const [changeStarted, setChangeStarted] = useState<boolean>(false);
  const [savingState, setSavingState] = useState<SavingState>(
    SavingState.NOT_STARTED,
  );
  const valueRef = React.useRef(defaultValue);

  useEffect(() => {
    setSavingState(props.savingState);
  }, [props.savingState]);

  useEffect(() => {
    return () => {
      onBlur(valueRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValue(defaultValue);
    setIsEditing(!!isEditingDefault);
  }, [defaultValue, isEditingDefault]);

  useEffect(() => {
    if (props.forceDefault === true) setValue(defaultValue);
  }, [props.forceDefault, defaultValue]);

  const themeDetails = useSelector(getThemeDetails);
  const bgColor = useMemo(
    () =>
      editModeBgcolor(!!isInvalid, isEditing, savingState, themeDetails.theme),
    [isInvalid, isEditing, savingState, themeDetails],
  );

  const editMode = useCallback(
    (e: React.MouseEvent) => {
      setIsEditing(true);
      const errorMessage = inputValidation && inputValidation(defaultValue);
      setIsInvalid(errorMessage ? errorMessage : false);
      e.preventDefault();
      e.stopPropagation();
    },
    [inputValidation, defaultValue],
  );

  const onConfirm = useCallback(
    (_value: string) => {
      if (savingState === SavingState.ERROR || isInvalid) {
        setValue(lastValidValue);
        onBlur(lastValidValue);
        setSavingState(SavingState.NOT_STARTED);
      } else if (changeStarted) {
        onTextChanged(_value);
        onBlur(_value);
      }
      setIsEditing(false);
      setChangeStarted(false);
    },
    [
      changeStarted,
      savingState,
      isInvalid,
      lastValidValue,
      onBlur,
      onTextChanged,
    ],
  );

  const onInputchange = useCallback(
    (_value: string) => {
      const finalVal: string = _value;
      const errorMessage = inputValidation && inputValidation(finalVal);
      const error = errorMessage ? errorMessage : false;
      if (!error) {
        setLastValidValue(finalVal);
        valueRef.current = finalVal;
      }
      setValue(finalVal);
      setIsInvalid(error);
      setChangeStarted(true);
    },
    [inputValidation],
  );

  const iconName =
    !isEditing && savingState === SavingState.NOT_STARTED && !props.hideEditIcon
      ? "edit"
      : !isEditing && savingState === SavingState.SUCCESS
      ? "success"
      : savingState === SavingState.ERROR || (isEditing && !!isInvalid)
      ? "error"
      : undefined;

  const nonEditMode = () => {
    if (!isEditing && savingState === SavingState.SUCCESS) {
      setSavingState(SavingState.NOT_STARTED);
    }
  };

  return (
    <EditableTextWrapper
      data-cy={props.cypressSelector}
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
          {savingState === SavingState.STARTED ? (
            <Spinner size={IconSize.XL} />
          ) : (
            <Icon name={iconName} size={IconSize.XL} />
          )}
        </IconWrapper>
      </TextContainer>
      {isEditing && !!isInvalid ? (
        <Text type={TextType.P2}>{isInvalid}</Text>
      ) : null}
    </EditableTextWrapper>
  );
};

EditableText.defaultProps = {
  fill: false,
};

export default EditableText;
