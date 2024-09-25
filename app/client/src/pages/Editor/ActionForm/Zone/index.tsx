import React from "react";
import styles from "./styles.module.css";

interface ZoneProps {
  children: React.ReactNode;
  layout?: "single_column" | "double_column";
  isFullSize?: boolean;
}

const Zone: React.FC<ZoneProps> = ({
  children,
  isFullSize = false,
  layout = "single_column",
}) => {
  return (
    <div
      className={styles.zone}
      data-full-size={isFullSize.toString()}
      data-layout={layout}
    >
      {children}
    </div>
  );
};

export { Zone };
