import React, { useState } from "react";
import styled from "styled-components";
import { TagInput } from "@blueprintjs/core";
import {
  Intent,
  IntentColors,
  getColorWithOpacity,
} from "constants/DefaultTheme";
const TagInputWrapper = styled.div<{ intent?: Intent }>`
  &&& {
    .bp3-tag {
      color: ${props => props.theme.colors.textDefault};
      font-size: ${props => props.theme.fontSizes[3]}px;
      background: ${props =>
        props.intent
          ? getColorWithOpacity(IntentColors[props.intent], 0.2)
          : getColorWithOpacity(IntentColors.none, 0.2)};
      border: 1px solid
        ${props =>
          props.intent ? IntentColors[props.intent] : IntentColors.none};
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
};

/**
 * TagInputComponent
 * Takes in a comma separated set of values (input.value prop) to display in tags
 * On addition or removal of tags, passes the comman separated string to input.onChange prop
 * @param props : TagInputProps
 */
const TagInputComponent = (props: TagInputProps) => {
  const _values =
    props.input.value &&
    props.input.value.length > 0 &&
    props.input.value.split(",");

  const [values, setValues] = useState<string[]>(_values || []);
  const [currentValue, setCurrentValue] = useState<string>("");

  const commitValues = (newValues: string[]) => {
    setValues(newValues);
    props.input.onChange &&
      props.input.onChange(newValues.filter(Boolean).join(","));
  };

  const onTagsChange = (values: React.ReactNode[]) => {
    const _values = values as string[];
    commitValues(_values);
  };

  const onKeyDown = (e: any) => {
    // Add new values to the tags on comma, return key, space and Tab press.
    if (
      e.key === "," ||
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "Tab"
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

  return (
    <TagInputWrapper intent={props.intent}>
      <TagInput
        inputProps={{ type: props.type, value: currentValue }}
        onInputChange={handleInputChange}
        placeholder={props.placeholder}
        values={_values || [""]}
        separator={props.separator || ","}
        addOnPaste
        onChange={onTagsChange}
        onKeyDown={onKeyDown}
        tagProps={{
          round: true,
        }}
        large
      />
    </TagInputWrapper>
  );
};

export default TagInputComponent;
