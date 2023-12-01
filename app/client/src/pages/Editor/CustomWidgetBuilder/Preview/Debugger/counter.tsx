import React from "react";
import { Icon } from "design-system";
import styles from "./styles.module.css";

export default function Counter(props: {
  log: number;
  error: number;
  warn: number;
  onClick: () => void;
}) {
  const { error, log, onClick, warn } = props;

  return (
    <div className={styles.consoleCounter} onClick={() => onClick()}>
      <div className={styles.consoleCounterItem}>
        <Icon
          name="close-circle"
          size="sm"
          style={{
            color: "var(--ads-v2-color-red-600)",
          }}
        />
        {error}
      </div>
      <div className={styles.consoleCounterItem}>
        <Icon
          name="alert-fill"
          size="sm"
          style={{
            color: "var(--ads-v2-color-yellow-600)",
          }}
        />
        {warn}
      </div>
      <div className={styles.consoleCounterItem}>
        <Icon name="snippet" size="sm" />
        {log}
      </div>
    </div>
  );
}
