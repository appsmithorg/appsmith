/* eslint-disable react/no-unused-prop-types */
import React, { forwardRef } from "react";

import { Box } from "../../Box";

import styles from "./styles.module.css";

export interface InputLabelProps
  extends React.ComponentPropsWithoutRef<"label"> {
  /** Label content */
  children?: React.ReactNode;

  /** Label root element */
  labelElement?: "label" | "div";

  /** Determines whether required asterisk should be displayed */
  required?: boolean;
}

export const InputLabel = forwardRef<HTMLLabelElement, InputLabelProps>(
  ({ children, htmlFor, labelElement = "label", required, ...others }, ref) => {
    return (
      <Box<"label">
        component={labelElement as "label"}
        htmlFor={labelElement === "label" ? htmlFor : undefined}
        ref={ref}
        {...others}
      >
        {children}
        {required && (
          <span aria-hidden className={styles.required}>
            {" *"}
          </span>
        )}
      </Box>
    );
  },
);

InputLabel.displayName = "@appsmith/wds";
