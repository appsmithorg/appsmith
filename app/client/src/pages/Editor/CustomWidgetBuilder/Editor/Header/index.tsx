import React from "react";
import styles from "./styles.module.css";
import WidgetName from "./widgetName";
import ReferenceTrigger from "./referenceTrigger";
import { CodeTemplates } from "./CodeTemplates";

export default function Header() {
  return (
    <>
      <div className={styles.headerControlsLeft}>
        <WidgetName />
        <CodeTemplates />
      </div>
      <div className={styles.headerControlsRight}>
        <ReferenceTrigger />
      </div>
    </>
  );
}
