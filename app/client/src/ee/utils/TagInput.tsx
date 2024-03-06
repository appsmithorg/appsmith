import type { ReactElement } from "react";
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import type { Intent } from "@blueprintjs/core";
import { Classes, TagInput } from "@blueprintjs/core";
import _ from "lodash";
import {
  createMessage,
  INVITE_USERS_VALIDATION_EMAIL_LIST,
} from "@appsmith/constants/messages";
import { HighlightText } from "design-system-old";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

export const isEmail = (value: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(value);
};

const TagInputWrapper = styled.div`
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;

  &&& {
    .${Classes.TAG_INPUT} {
      background-color: var(--ads-v2-color-bg);
      border: 1px solid var(--ads-v2-color-border);
      border-radius: var(--ads-v2-border-radius);
      font-family: var(--ads-v2-font-family);
      font-size: var(--ads-v2-font-size-4);
      box-shadow: none;
      min-height: 36px;
      &:hover {
        border-color: var(--ads-v2-color-border-emphasis);
      }
      &:focus,
      &:active {
        border-color: var(--ads-v2-color-border-emphasis);
        outline: var(--ads-v2-border-width-outline) solid
          var(--ads-v2-color-outline);
        outline-offset: var(--ads-v2-offset-outline);
      }
    }
    .${Classes.TAG_INPUT}.${Classes.ACTIVE} {
      border: 1px solid var(--ads-v2-color-border-emphasis-plus);
      outline: var(--ads-v2-border-width-outline) solid
        var(--ads-v2-color-outline);
      outline-offset: var(--ads-v2-offset-outline);
    }
    .${Classes.INPUT_GHOST} {
      color: var(--ads-v2-color-fg);
      &::placeholder {
        color: var(--ads-v2-color-fg-subtle);
        font-size: var(--ads-v2-font-size-4);
      }
    }
    .${Classes.TAG} {
      background-color: var(--ads-v2-color-bg-subtle);
      color: var(--ads-v2-color-fg);
      border-radius: var(--ads-v2-border-radius);
      color: var(--ads-v2-color-gray-600);
      font-size: var(--ads-v2-font-size-4);
      font-weight: var(--ads-v2-font-weight-normal);
      letter-spacing: var(--ads-v2-letter-spacing-3);

      &.suggestion_tag {
        background-color: var(--ads-v2-color-bg);
        color: var(--ads-v2-color-fg-brand);
        border: 1px solid var(--ads-v2-color-bg-brand);
        border-radius: var(--ads-v2-border-radius);
      }

      .${Classes.TAG_REMOVE} {
        margin-top: 0;
      }
    }
  }
`;

const SuggestionsWrapper = styled.div`
  margin-top: 4px;
  position: relative;
  width: 100%;

  svg {
    path {
      fill: var(--ads-v2-color-fg);
    }
  }

  > div {
    position: absolute;
    border: 1px solid var(--ads-v2-color-border);
    border-radius: var(--ads-v2-border-radius);
    width: 100%;
    background: var(--ads-v2-color-bg);
    max-height: 160px;
    overflow: auto;
    z-index: 1;
  }
`;

const Suggestion = styled.div`
  padding: 8px;
  cursor: pointer;
  display: flex;
  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }
`;

interface TagInputProps {
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
  hasError?: boolean;
  customError?: (error: any, values?: any) => void;
  suggestions?: { id: string; name: string; icon?: string }[];
  suggestionLeftIcon?: ReactElement;
}

function getValues(inputValues: any, suggestions: any[]) {
  const values =
    inputValues && inputValues.length > 0 ? inputValues.split(",") : [];
  if (suggestions?.length > 0) {
    for (const j in values) {
      const index = _.findIndex(suggestions, { id: values[j] });
      if (index > -1) {
        values[j] = suggestions[index].name;
      }
    }
  }
  return values;
}

/**
 * TagInputComponent
 * Takes in a comma separated set of values (input.value prop) to display in tags
 * On addition or removal of tags, passes the comman separated string to input.onChange prop
 * @param props : TagInputProps
 */
function TagInputComponent(props: TagInputProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<any[]>([]);
  const [values, setValues] = useState<string[]>(
    getValues(props?.input?.value, selectedSuggestions),
  );

  const [currentValue, setCurrentValue] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<
    { id: string; name: string }[]
  >(props?.suggestions || []);
  const mappedSuggestions = useMemo(() => {
    return (showSuggestions ? suggestions : []).map((each: any) => (
      <Suggestion
        className="each-suggestion"
        key={each.id}
        onClick={() => handleSuggestionClick(each.id)}
      >
        {props.suggestionLeftIcon ?? null}
        <HighlightText highlight={currentValue} text={each.name} />
      </Suggestion>
    ));
  }, [showSuggestions, suggestions]);

  useEffect(() => {
    setSuggestions(props?.suggestions || []);
  }, [props.suggestions]);

  useEffect(() => {
    setValues(getValues(props?.input?.value, selectedSuggestions));
  }, [props.input.value]);

  const validateEmail = (newValues: string[]) => {
    if (newValues && newValues.length > 0) {
      let error = "";
      newValues.forEach((user: any) => {
        if (!isEmail(user)) {
          error = createMessage(
            INVITE_USERS_VALIDATION_EMAIL_LIST,
            cloudHosting,
          );
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
    const _values = (values as string[]).map((val) => {
      const suggestion = selectedSuggestions.find(
        (group: any) => group.name === val,
      );
      return suggestion ? suggestion.id : val;
    });
    setSelectedSuggestions(
      selectedSuggestions.filter((suggestion) =>
        values.includes(suggestion.name),
      ),
    );

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
      const _values = (values as string[]).map((val) => {
        const suggestion = selectedSuggestions.find(
          (group: any) => group.name === val,
        );
        return suggestion ? suggestion.id : val;
      });
      const newValues = [..._values, e.target.value];
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

    if (
      /^[a-zA-Z0-9`!@#$%^&*()_+\-=\[\]{};':"\\|.<>\/?~]+$/.test(e.key) &&
      !(currentValue.length < 2 && e.key === "Backspace")
    ) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
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
          suggestions.filter(
            (s) => s.name?.toLowerCase().includes(e.target.value.toLowerCase()),
          );
        setSuggestions(results);
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
      (e?.target?.value?.trim() &&
        ((showSuggestions && suggestions.length === 0) ||
          (!showSuggestions && suggestions.length > 0))) ||
      isEmail(e.target.value)
    ) {
      const _values = (values as string[]).map((val) => {
        const suggestion = selectedSuggestions.find(
          (group: any) => group.name === val,
        );
        return suggestion ? suggestion.id : val;
      });
      const newValues = [..._values, e.target.value];
      commitValues(newValues);
      setCurrentValue("");
      e.preventDefault();
    }
  };

  const handleSuggestionClick = (value: string) => {
    const getSuggestionData = props.suggestions?.find(
      (group: any) => group.id === value,
    );
    setCurrentValue("");
    setSuggestions(props?.suggestions || []);
    setShowSuggestions(false);
    if (getSuggestionData) {
      props?.input?.onChange?.(
        [props?.input?.value, getSuggestionData?.id].filter(Boolean).join(","),
      );
      setSelectedSuggestions([...selectedSuggestions, getSuggestionData]);
    }
  };

  return (
    <TagInputWrapper>
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
          className: `${tag}_tag ${
            !isEmail(tag as string) &&
            selectedSuggestions.find((suggestion) => suggestion.name === tag)
              ? "suggestion_tag"
              : ""
          }`,
          round: true,
        })}
        values={values || [""]}
      />
      {mappedSuggestions.length > 0 && (
        <SuggestionsWrapper>
          <div className="suggestions-list">{mappedSuggestions}</div>
        </SuggestionsWrapper>
      )}
    </TagInputWrapper>
  );
}

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <TagInputComponent {...componentProps} />;
};

interface TagListFieldProps {
  autofocus?: boolean;
  name: string;
  placeholder: string;
  type: string;
  label: string;
  intent: Intent;
  customError: (err: string, values?: string[]) => void;
  suggestions?: { id: string; name: string; icon?: string }[];
  suggestionLeftIcon?: ReactElement;
}

function TagListField(props: TagListFieldProps) {
  return <Field component={renderComponent} {...props} />;
}

export default TagListField;
