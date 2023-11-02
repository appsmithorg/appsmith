import type { Ref } from "react";
import React, { useCallback, useRef } from "react";
import { useTextField } from "@react-aria/textfield";
import { chain, useLayoutEffect } from "@react-aria/utils";
import { useControlledState } from "@react-stately/utils";

import type { TextAreaProps } from "./types";
import { TextInputBase } from "../../TextInputBase";

export type TextAreaRef = Ref<HTMLDivElement>;

function TextArea(props: TextAreaProps, ref: TextAreaRef) {
  const {
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    onChange,
    ...otherProps
  } = props;

  // not in stately because this is so we know when to re-measure, which is a spectrum design
  const [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue,
    () => {
      //
    },
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onHeightChange = useCallback(() => {
    // Quiet textareas always grow based on their text content.
    // Standard textareas also grow by default, unless an explicit height is set.
    if (props.height == null && inputRef.current) {
      const input = inputRef.current;
      const prevAlignment = input.style.alignSelf;
      const prevOverflow = input.style.overflow;
      // Firefox scroll position is lost when overflow: 'hidden' is applied so we skip applying it.
      // The measure/applied height is also incorrect/reset if we turn on and off
      // overflow: hidden in Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1787062
      const isFirefox = "MozAppearance" in input.style;
      if (!isFirefox) {
        input.style.overflow = "hidden";
      }
      input.style.alignSelf = "start";
      input.style.height = "auto";
      // offsetHeight - clientHeight accounts for the border/padding.
      input.style.height = `${
        input.scrollHeight + (input.offsetHeight - input.clientHeight)
      }px`;
      input.style.overflow = prevOverflow;
      input.style.alignSelf = prevAlignment;
    }
  }, [inputRef, props.height]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue, inputRef.current]);

  if (props.placeholder != null) {
    // eslint-disable-next-line no-console
    console.warn(
      "Placeholders are deprecated due to accessibility issues. Please use help text instead. See the docs for details: https://react-spectrum.adobe.com/react-spectrum/TextArea.html#help-text",
    );
  }

  const { descriptionProps, errorMessageProps, inputProps, labelProps } =
    useTextField(
      {
        ...props,
        onChange: chain(onChange, setInputValue),
        inputElementType: "textarea",
      },
      inputRef,
    );

  return (
    <TextInputBase
      {...otherProps}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      inputProps={inputProps}
      inputRef={inputRef}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      labelProps={labelProps}
      multiLine
      ref={ref}
    />
  );
}

/**
 * TextAreas are multiline text inputs, useful for cases where users have
 * a sizable amount of text to enter. They allow for all customizations that
 * are available to text fields.
 */
const _TextArea = React.forwardRef(TextArea);
export { _TextArea as TextArea };
