import React from "react";
import styles from "./styles.module.css";

interface ZoneProps {
  children: React.ReactNode;
  layout?: "single-column" | "double-column";
}

const Zone: React.FC<ZoneProps> = ({ children, layout = "single-column" }) => {
  return (
    <div className={styles.zone} data-layout={layout}>
      {children}
    </div>
  );
};

export { Zone };
