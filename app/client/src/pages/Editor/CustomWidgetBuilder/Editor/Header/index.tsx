import React from "react";
import styles from "./styles.module.css";
import WidgetName from "./widgetName";
import LayoutControls from "./layoutControls";
import ReferrenceTrigger from "./referrenceTrigger";

export default function Header() {
  return (
    <>
      <div className={styles.headerControlsLeft}>
        <WidgetName />
        <LayoutControls />
      </div>
      <div className={styles.headerControlsRight}>
        <ReferrenceTrigger />
      </div>
    </>
  );
}
