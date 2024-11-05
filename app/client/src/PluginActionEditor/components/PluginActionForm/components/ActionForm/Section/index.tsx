import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  withoutPadding?: boolean;
  isFullWidth?: boolean;
}

const Section: React.FC<SectionProps> = ({
  children,
  className,
  isFullWidth = false,
  withoutPadding = false,
  ...props
}) => {
  const classNames = clsx(styles.section, className);

  return (
    <div
      className={classNames}
      data-fullwidth={isFullWidth.toString()}
      data-withoutPadding={withoutPadding.toString()}
      {...props}
    >
      {children}
    </div>
  );
};

export { Section };
