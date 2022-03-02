import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Classes, TagInput } from "@blueprintjs/core";
import { Intent } from "constants/DefaultTheme";
import {
  createMessage,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import { Colors } from "constants/Colors";
const TagInputWrapper = styled.div<{ intent?: Intent }>`
  margin-right: 8px;

  &&& {
    .${Classes.TAG_INPUT} {
      background-color: ${(props) => props.theme.colors.tagInput.bg};
      min-height: 38px;
      border: 1.2px solid ${Colors.ALTO2};
      border-radius: 0px;
    }
    .${Classes.TAG_INPUT}.${Classes.ACTIVE} {
      border: 1px solid ${(props) => props.theme.colors.info.main};
      box-shadow: ${(props) => props.theme.colors.tagInput.shadow};
    }
    .${Classes.INPUT_GHOST} {
      color: ${(props) => props.theme.colors.tagInput.text};
      &::placeholder {
        color: ${(props) => props.theme.colors.tagInput.placeholder};
      }
    }
    .${Classes.TAG} {
      padding: 3px 10px;
      color: ${(props) => props.theme.colors.tagInput.tag.text};
      background-color: ${(props) => props.theme.colors.info.main};
      border-radius: 0px;
      font-size: 11px;
      letter-spacing: 0.4px;

      .${Classes.TAG_REMOVE} {
        margin-top: 0;
      }
    }
  }
`;
type TagInputProps = {
  /** TagInput Placeholder */
  placeholder: string;
  /** TagInput value and onChange handler */
  input: {
    value?: string;
    onChange?: (value: string) => void;
  };
  /** TagInput type of individual entries (HTML input types) */
  type: string;
  /** A delimiter which decides when to separate string into tags */
  separator?: string | RegExp | undefined;
  /** Intent of the tags, which defines their color */
  intent?: Intent;
  hasError?: boolean;
  customError: (values: any) => void;
};

/**
 * TagInputComponent
 * Takes in a comma separated set of values (input.value prop) to display in tags
 * On addition or removal of tags, passes the comman separated string to input.onChange prop
 * @param props : TagInputProps
 */
function TagInputComponent(props: TagInputProps) {
  const _values =
    props.input.value && props.input.value.length > 0
      ? props.input.value.split(",")
      : [];

  const [values, setValues] = useState<string[]>(_values || []);
  const [currentValue, setCurrentValue] = useState<string>("");

  useEffect(() => {
    if (_values.length === 0 && values.length > 0) {
      setValues([]);
    }
  }, [_values, values]);

  const validateEmail = (newValues: string[]) => {
    if (newValues && newValues.length > 0) {
      let error = "";
      newValues.forEach((user: any) => {
        if (!isEmail(user)) {
          error = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
        }
      });
      props.customError(error);
    } else {
      props.customError("");
    }
  };

  const commitValues = (newValues: string[]) => {
    setValues(newValues);
    props.input.onChange &&
      props.input.onChange(newValues.filter(Boolean).join(","));
    validateEmail(newValues);
  };

  const onTagsChange = (values: React.ReactNode[]) => {
    const _values = values as string[];
    commitValues(_values);
  };

  const onKeyDown = (e: any) => {
    // Add new values to the tags on comma, return key, space and Tab press
    // only if user has typed something on input
    if (
      (e.key === "," ||
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "Tab") &&
      e.target.value
    ) {
      const newValues = [...values, e.target.value];
      commitValues(newValues);
      setCurrentValue("");
      e.preventDefault();
    } else if (e.key === "Backspace") {
      if (e.target.value.length === 0) {
        const newValues = values.slice(0, -1);
        commitValues(newValues);
      }
    }
  };

  // The input text field where the user can type in needs to handle the scenario where
  // The input field is reset on adding tag.
  const handleInputChange = (e: any) => {
    if ([",", " ", "Enter"].indexOf(e.target.value) === -1) {
      setCurrentValue(e.target.value);
    } else {
      setCurrentValue("");
    }
  };

  const handleInputBlur = (e: any) => {
    if (e.target.value.trim()) {
      const newValues = [...values, e.target.value];
      commitValues(newValues);
      setCurrentValue("");
      e.preventDefault();
    }
  };

  return (
    <TagInputWrapper intent={props.intent}>
      <TagInput
        addOnPaste
        inputProps={{
          type: props.type,
          value: currentValue,
          onBlur: handleInputBlur,
        }}
        large={false}
        onChange={onTagsChange}
        onInputChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder={props.placeholder}
        separator={props.separator || ","}
        tagProps={{
          round: true,
        }}
        values={_values || [""]}
      />
    </TagInputWrapper>
  );
}

export default TagInputComponent;
