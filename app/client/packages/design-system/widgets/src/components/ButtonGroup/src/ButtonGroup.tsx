import React, { forwardRef } from "react";
import { StyledContainer } from "./index.styled";
import { ORIENTATION } from "./types";

import type { ButtonGroupProps } from "./types";

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const { orientation = ORIENTATION.horizontal, ...others } = props;

    return (
      <StyledContainer
        data-orientation={
          orientation === ORIENTATION.vertical ? "vertical" : undefined
        }
        ref={ref}
        {...others}
      />
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
