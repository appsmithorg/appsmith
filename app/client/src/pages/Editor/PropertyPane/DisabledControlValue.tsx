import React from "react";
import styled from "styled-components";

const ValueBlock = styled.pre`
  margin: 0;
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-3);
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ads-v2-font-family-code);
  font-size: var(--ads-v2-font-size-2);
  color: var(--ads-v2-color-fg);
  background-color: var(--ads-v2-color-bg-subtle);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
`;

/**
 * Returns the text to show for a disabled control's value.
 *
 * - A non-blank string is shown as it is.
 * - A number or a boolean is shown as text.
 * - Anything else, such as an empty string, an object or `undefined`,
 *   returns `null`, so nothing is shown.
 */
export function getDisabledControlValueText(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() === "" ? null : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

interface DisabledControlValueProps {
  /** The property's label. Screen readers use it to name the text box. */
  label: string;
  value: unknown;
}

/**
 * Shows a disabled control's current value as read-only text.
 *
 * A disabled control is not rendered, so its value is hidden. A control
 * whose config sets `showValueWhenDisabled` shows the value here instead,
 * so the builder can still read it. React escapes the text, so the value is
 * never treated as markup.
 */
export function DisabledControlValue(props: DisabledControlValueProps) {
  const text = getDisabledControlValueText(props.value);

  if (text === null) return null;

  return (
    <ValueBlock
      aria-label={props.label}
      aria-multiline="true"
      aria-readonly="true"
      data-testid="t--property-control-disabled-value"
      role="textbox"
      tabIndex={0}
    >
      {text}
    </ValueBlock>
  );
}
