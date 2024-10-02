import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isStandalone?: boolean;
}

const Section: React.FC<SectionProps> = ({
  children,
  className,
  isStandalone = false,
  ...props
}) => {
  const classNames = clsx(styles.section, className);

  return (
    <div
      className={classNames}
      data-standalone={isStandalone.toString()}
      {...props}
    >
      {children}
    </div>
  );
};

export { Section };
