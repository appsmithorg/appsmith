import React from "react";
import styles from "./styles.module.css";

interface SectionProps {
  children: React.ReactNode;
  isStandalone?: boolean;
  isFullSize?: boolean;
}

const Section: React.FC<SectionProps> = ({
  children,
  isFullSize = false,
  isStandalone = false,
}) => {
  return (
    <div
      className={styles.section}
      data-full-size={isFullSize.toString()}
      data-standalone={isStandalone.toString()}
    >
      {children}
    </div>
  );
};

export { Section };
