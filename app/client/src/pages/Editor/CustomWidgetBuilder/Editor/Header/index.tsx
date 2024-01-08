import React from "react";
import styles from "./styles.module.css";
import WidgetName from "./widgetName";
import LayoutControls from "./layoutControls";
import ReferenceTrigger from "./referenceTrigger";
import { CodeTemplates } from "./CodeTemplates";

export default function Header() {
  return (
    <>
      <div className={styles.headerControlsLeft}>
        <WidgetName />
        <CodeTemplates />
        <LayoutControls />
      </div>
      <div className={styles.headerControlsRight}>
        <ReferenceTrigger />
      </div>
    </>
  );
}
