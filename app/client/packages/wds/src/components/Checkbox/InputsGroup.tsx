import React from "react";
import cx from "clsx";

import styles from "./styles.module.css";

type InputsGroupProps = {
  orientation: "horizontal" | "vertical";
  role?: string;
  children: React.ReactNode;
  className?: string;
};

export function InputsGroup({
  children,
  className = "",
  orientation,
  role,
}: InputsGroupProps) {
  const computedClassnames = cx(
    styles["inputs-group"],
    styles[orientation],
    className,
  );

  return (
    <div className={computedClassnames} role={role}>
      {children}
    </div>
  );
}
