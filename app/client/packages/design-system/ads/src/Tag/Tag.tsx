import React from "react";

import type { TagProps } from "./Tag.types";
import { StyledButton, StyledTag } from "./Tag.styles";
import { Text } from "../Text";

/*TODO:
 * It is unclear how the tag component can be interacted with using the keyboard.
 * Should just the icon have a focus style? Should the whole tag have a focus style?
 * Should the escape key dismiss the tag? Or should the enter key dismiss the tag when the icon is focused?
 */
function Tag({
  children,
  isClosable,
  kind = "neutral",
  onClose,
  ...rest
}: TagProps) {
  const [isClosed, setClosed] = React.useState(false);

  const closeHandler = () => {
    setClosed(true);
    onClose && onClose();
  };

  return (
    <StyledTag isClosed={isClosed} kind={kind} {...rest}>
      <Text color="inherit" kind="body-s">
        {children}
      </Text>
      {isClosable && (
        // We are setting unsafe height here because this is a rare case where a smaller icon button is needed.
        <StyledButton
          UNSAFE_height="12px !important"
          UNSAFE_width="12px !important"
          isIconButton
          kind="tertiary"
          onClick={closeHandler}
          size="sm"
          startIcon="close-line"
        />
      )}
    </StyledTag>
  );
}

Tag.displayName = "Tag";

Tag.defaultProps = {
  size: "sm",
  isClosable: true,
};

export { Tag };
