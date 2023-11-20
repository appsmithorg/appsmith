import React from "react";
import styles from "./styles.module.css";
import Collapsible from "./collapsible";
import Help from "./help";
import ModelVariables from "./modelVariables";
import Events from "./events";

export default function Referrences() {
  return (
    <div className={styles.referrences}>
      <Collapsible label="Model variables">
        <ModelVariables />
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
