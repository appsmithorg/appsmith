import React, { forwardRef } from "react";
import clsx from "clsx";

import styles from "./styles.module.css";

export interface InputErrorProps extends React.ComponentPropsWithoutRef<"div"> {
  children?: React.ReactNode;
}

export const InputError = forwardRef<HTMLDivElement, InputErrorProps>(
  ({ children, className = "", ...others }, ref) => {
    const computedClassnames = clsx({
      [styles.error]: true,
      [className]: true,
    });

    return (
      <p className={computedClassnames} ref={ref} role="alert" {...others}>
        {children}
      </p>
    );
  },
);

InputError.displayName = "@appsmith/wds";
