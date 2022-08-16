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
import { HighlightText } from "design-system";

const TagInputWrapper = styled.div<{ intent?: Intent }>`
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  position: relative;

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

const SuggestionsWrapper = styled.div`
  margin-top: 4px;
  position: relative;
  left: 4px;
  width: 100%;

  > div {
    position: absolute;
    border: 1px solid var(--appsmith-color-black-250);
    width: 100%;
    background: var(--appsmith-color-black-0);
  }
`;

const Suggestion = styled.div`
  padding: 8px;
  cursor: pointer;
  &:hover {
    background: var(--appsmith-color-black-100);
  }
`;

type TagInputProps = {
  autofocus?: boolean;
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
  customError?: (error: any, values?: any) => void;
  suggestions?: { id: string; name: string; icon?: string }[];
};

function getValues(inputValues: any) {
  return inputValues && inputValues.length > 0 ? inputValues.split(",") : [];
}

/**
 * TagInputComponent
 * Takes in a comma separated set of values (input.value prop) to display in tags
 * On addition or removal of tags, passes the comman separated string to input.onChange prop
 * @param props : TagInputProps
 */
function TagInputComponent(props: TagInputProps) {
  const [values, setValues] = useState<string[]>(
    getValues(props?.input?.value),
  );
  const [currentValue, setCurrentValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string }[]
  >(props?.suggestions || []);
  const mappedSuggestions = (showSuggestions ? suggestions : []).map(
    (each: any) => (
      <Suggestion
        key={each.id}
        onClick={() => handleSuggestionClick(each.name)}
      >
        <HighlightText highlight={currentValue} text={each.name} />
      </Suggestion>
    ),
  );

  useEffect(() => {
    setValues(getValues(props?.input?.value));
  }, [props.input.value]);

  const validateEmail = (newValues: string[]) => {
    if (newValues && newValues.length > 0) {
      let error = "";
      newValues.forEach((user: any) => {
        if (!isEmail(user)) {
          error = createMessage(INVITE_USERS_VALIDATION_EMAIL_LIST);
        }
      });
      props.customError?.(error, newValues);
    } else {
      props.customError?.("");
    }
  };

  const commitValues = (newValues: string[]) => {
    setValues(newValues);
    props.input.onChange &&
      props.input.onChange(newValues.filter(Boolean).join(","));
    props.customError?.("", newValues);
    props.type === "email" && validateEmail(newValues);
  };

  const onTagsChange = (values: React.ReactNode[]) => {
    const _values = values as string[];
    if (props?.suggestions) {
      setSuggestions(props.suggestions);
    }
    commitValues(_values);
  };

  const onKeyDown = (e: any) => {
    let resetSuggestions = false;
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
      resetSuggestions = true;
      e.preventDefault();
    } else if (e.key === "Backspace") {
      if (e.target.value.length === 0) {
        const newValues = values.slice(0, -1);
        commitValues(newValues);
      }
      resetSuggestions = true;
    }

    if (resetSuggestions && props?.suggestions) {
      setSuggestions(props.suggestions);
    }
  };

  // The input text field where the user can type in needs to handle the scenario where
  // The input field is reset on adding tag.
  const handleInputChange = (e: any) => {
    if ([",", " ", "Enter"].indexOf(e.target.value) === -1) {
      setCurrentValue(e.target.value);
      if (props?.suggestions) {
        const results =
          suggestions &&
          suggestions.filter((s) => s.name?.includes(e.target.value));
        setSuggestions(results);
        setShowSuggestions(true);
      }
    } else {
      setCurrentValue("");
      if (props?.suggestions) {
        setSuggestions(props.suggestions);
      }
    }
  };

  const handleInputBlur = (e: any) => {
    if (
      (e?.target?.value?.trim() && !showSuggestions && !suggestions.length) ||
      isEmail(e.target.value)
    ) {
      const newValues = [...values, e.target.value];
      commitValues(newValues);
      setCurrentValue("");
      e.preventDefault();
    }
  };

  const handleSuggestionClick = (value: string) => {
    setCurrentValue("");
    setSuggestions(props?.suggestions || []);
    setShowSuggestions(false);
    props?.input?.onChange?.(
      [props?.input?.value, value].filter(Boolean).join(","),
    );
  };

  return (
    <TagInputWrapper intent={props.intent}>
      <TagInput
        addOnPaste
        inputProps={{
          type: props.type,
          value: currentValue,
          onBlur: handleInputBlur,
          autoFocus: props.autofocus,
        }}
        large={false}
        onChange={onTagsChange}
        onInputChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder={props.placeholder}
        separator={props.separator || ","}
        tagProps={(tag) => ({
          className: `${tag}_tag`,
          round: true,
        })}
        values={values || [""]}
      />
      {showSuggestions && (
        <SuggestionsWrapper>
          <div>{mappedSuggestions}</div>
        </SuggestionsWrapper>
      )}
    </TagInputWrapper>
  );
}

export default TagInputComponent;
