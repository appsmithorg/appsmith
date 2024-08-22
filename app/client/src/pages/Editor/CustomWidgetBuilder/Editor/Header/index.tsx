import React from "react";

import { CodeTemplates } from "./CodeTemplates";
import LayoutControls from "./layoutControls";
import ReferenceTrigger from "./referenceTrigger";
import styles from "./styles.module.css";
import WidgetName from "./widgetName";

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
