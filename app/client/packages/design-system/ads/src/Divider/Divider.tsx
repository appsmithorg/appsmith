import React from "react";
import type { DividerProps } from "./Divider.types";
import { StyledDivider } from "./Divider.styles";

/**
 * A Divider is used to separate content into distinct sections.
 * It must be used in elements that are direct children of a container.
 * It is not intended to be used as a border.
 *
 * @param orientation
 * @constructor
 */
function Divider({ orientation, ...rest }: DividerProps) {
  return <StyledDivider orientation={orientation} {...rest} />;
}

Divider.displayName = "Divider";

Divider.defaultProps = {
  orientation: "horizontal",
};

export { Divider };
