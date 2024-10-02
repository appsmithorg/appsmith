import type { ReactNode } from "react";
import type React from "react";

export type TextKind =
  | "heading-xl"
  | "heading-l"
  | "heading-m"
  | "heading-s"
  | "heading-xs"
  | "body-m"
  | "body-s"
  | "action-l"
  | "action-m"
  | "action-s"
  | "code";

// Text props
export type TextProps = {
  /** to change the rendering component */
  renderAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "label";
  /** (try not to) pass addition classes here */
  className?: string;
  /** the words you want to display */
  children: ReactNode;
  /** style the text based on it's function */
  kind?: TextKind;
  /** the color of the text. Accepts any valid css value. */
  color?: string;
  /** whether the text is bold or not */
  isBold?: boolean;
  /** whether the text is italic or not */
  isItalic?: boolean;
  /** whether the text is underlined or not */
  isUnderlined?: boolean;
  /** whether the text is striked or not */
  isStriked?: boolean;
  /** whether the text is editable or not */
  isEditable?: boolean;
  /** input component props while isEditable is true */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  >;
  /** ref for input component */
  inputRef?: React.RefObject<HTMLInputElement>;
} & React.HTMLAttributes<HTMLLabelElement> &
  React.HTMLAttributes<HTMLHeadingElement> &
  React.HTMLAttributes<HTMLParagraphElement> &
  React.HTMLAttributes<HTMLSpanElement> &
  React.LabelHTMLAttributes<HTMLLabelElement>;
