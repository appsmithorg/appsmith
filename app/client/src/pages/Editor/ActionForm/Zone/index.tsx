import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface ZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  layout?: "single_column" | "double_column";
}

const Zone: React.FC<ZoneProps> = ({
  children,
  className,
  layout = "single_column",
  ...props
}) => {
  const classNames = clsx(styles.zone, className);

  return (
    <div className={classNames} data-layout={layout} {...props}>
      {children}
    </div>
  );
};

export { Zone };
