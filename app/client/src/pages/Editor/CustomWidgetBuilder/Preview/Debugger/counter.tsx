import React from "react";
import { Icon } from "@appsmith/ads";
import styles from "./styles.module.css";

export default function Counter(props: {
  log: number;
  error: number;
  warn: number;
  onClick: () => void;
}) {
  const { error, log, onClick, warn } = props;

  return (
    <div className={styles.debuggerCounter} onClick={() => onClick()}>
      <div className={styles.debuggerCounterItem}>
        <Icon
          name="close-circle"
          size="sm"
          style={{
            color: "var(--ads-v2-color-red-600)",
          }}
        />
        {error}
      </div>
      <div className={styles.debuggerCounterItem}>
        <Icon
          name="alert-fill"
          size="sm"
          style={{
            color: "var(--ads-v2-color-yellow-600)",
          }}
        />
        {warn}
      </div>
      <div className={styles.debuggerCounterItem}>
        <Icon name="snippet" size="sm" />
        {log}
      </div>
    </div>
  );
}
