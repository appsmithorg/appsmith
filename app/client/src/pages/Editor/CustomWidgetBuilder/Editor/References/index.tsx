import React from "react";
import styles from "./styles.module.css";
import Collapsible from "./collapsible";
import Help from "./help";
import LiveModel from "./liveModel";
import Events from "./events";

export default function References() {
  return (
    <div className={styles.references}>
      <Collapsible label="Live Model">
        <LiveModel />
      </Collapsible>
      <Collapsible label="Events">
        <Events />
      </Collapsible>
      <Collapsible label="Help">
        <Help />
      </Collapsible>
    </div>
  );
}
