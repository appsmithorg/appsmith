import React from "react";
import styles from "./styles.module.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FallbackIcon(props: any) {
  return (
    <svg
      // adding styles of icon here as well so that icon takes appropriate space even when the actual icon is not loaded
      className={styles.icon}
      data-icon=""
      data-testid="t--fallback-icon"
      {...props}
    />
  );
}

export { FallbackIcon };
