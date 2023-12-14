import React from "react";
import styles from "./styles.module.css";
import Collapsible from "./collapsible";
import Help from "./help";
import LiveModel from "./liveModel";
import Events from "./events";

export default function References() {
  return (
    <div className={styles.references}>
      <Collapsible
        helpMessage="Use `appsmith.model` to access your model in javascript"
        label="Live Model"
      >
        <LiveModel />
      </Collapsible>
      <Collapsible
        helpMessage="Use `appsmith.triggerEvent('<EVENT_NAME>')` to trigger events"
        label="Events"
      >
        <Events />
      </Collapsible>
      <Collapsible label="Help">
        <Help />
      </Collapsible>
    </div>
  );
}
