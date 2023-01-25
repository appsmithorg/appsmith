import React, { forwardRef } from "react";
import { Description } from "./index.styled";

export interface InputDescriptionProps
  extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
}

export const InputDescription = forwardRef<
  HTMLDivElement,
  InputDescriptionProps
>(({ children, ...others }, ref) => {
  return (
    <Description ref={ref} {...others}>
      {children}
    </Description>
  );
});

InputDescription.displayName = "@appsmith/wds/InputDescription";
