import React, { useState } from "react";
import styles from "./styles.module.css";
import { Icon } from "design-system";

interface Props {
  label: string;
  defaultOpen?: boolean;
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
        <div className={styles.collapsibleTitle}>{props.label}</div>
        <div className={styles.collapsibleIcon}>
          <Icon
            name={open ? "arrow-down-s-line" : "arrow-up-s-line"}
            size="lg"
          />
        </div>
      </div>
      {open && <div className={styles.collapsibleBody}>{props.children}</div>}
    </div>
  );
}
