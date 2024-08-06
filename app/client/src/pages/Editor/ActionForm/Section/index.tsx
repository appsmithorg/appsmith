import React from "react";
import styles from "./styles.module.css";

interface SectionProps {
  children: React.ReactNode;
  isStandalone?: boolean;
}

const Section: React.FC<SectionProps> = ({
  children,
  isStandalone = false,
}) => {
  return (
    <div className={styles.section} data-standalone={isStandalone.toString()}>
      {children}
    </div>
  );
};

export { Section };
