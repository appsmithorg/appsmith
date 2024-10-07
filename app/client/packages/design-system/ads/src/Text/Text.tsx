import React, { forwardRef } from "react";
import clsx from "classnames";
import type { RenderAsElement, TextProps } from "./Text.types";
import { StyledEditableInput, StyledText } from "./Text.styles";
import { TextClassName } from "./Text.constants";

/*
TODO:
 - add segment header style to list of styles
 */

const Text = forwardRef<RenderAsElement, TextProps>(function Text(
  {
    children,
    className,
    color,
    inputProps,
    inputRef,
    isEditable,
    kind,
    renderAs,
    ...rest
  }: TextProps,
  ref,
) {
  return (
    <StyledText
      as={renderAs}
      className={clsx(TextClassName, className)}
      color={color}
      data-bold={rest.isBold}
      data-italic={rest.isItalic}
      data-strikethrough={rest.isStrikethrough}
      data-underlined={rest.isUnderlined}
      data-value={isEditable && typeof children === "string" ? children : null}
      isEditable={isEditable && typeof children === "string"}
      kind={kind}
      ref={ref}
      {...rest}
    >
      {isEditable && typeof children === "string" ? (
        <StyledEditableInput ref={inputRef} value={children} {...inputProps} />
      ) : (
        children
      )}
    </StyledText>
  );
});

Text.displayName = "Text";

Text.defaultProps = {
  renderAs: "span",
  kind: "body-m",
};

export { Text };
