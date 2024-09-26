import React, { useState } from "react";
import styles from "./styles.module.css";
import { Icon, Tooltip } from "@appsmith/ads";

interface Props {
  label: string;
  defaultOpen?: boolean;
  helpMessage?: React.ReactNode;
  children: React.ReactNode;
}

export default function Collapsible(props: Props) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);

  return (
    <div className={styles.collapsible}>
      <div
        className={styles.collapsibleHeader}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <div className={styles.collapsibleTitle}>
          {props.label}
          {props.helpMessage && (
            <Tooltip content={props.helpMessage}>
              <Icon name="question" size="md" />
            </Tooltip>
          )}
        </div>
        <div className={styles.collapsibleIcon}>
          <Icon
            name={open ? "arrow-down-s-line" : "arrow-up-s-line"}
            size="md"
          />
        </div>
      </div>
      {open && <div className={styles.collapsibleBody}>{props.children}</div>}
    </div>
  );
}
