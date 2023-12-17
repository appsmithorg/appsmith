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
        helpMessage={
          <ol>
            <li>- Use `appsmith.model` to access your model in javascript</li>
            <li>
              - Use `appsmith.updateModel()` to update your model from
              javascript
            </li>
          </ol>
        }
        label="Live Model"
      >
        <LiveModel />
      </Collapsible>
      <Collapsible
        helpMessage={
          <ol>
            <li>
              - Use `appsmith.triggerEvent(&lt;EVENT_NAME&gt;)` to trigger an
              event
            </li>
            <li>
              - `appsmith.triggerEvent()` also accepts context data as second
              arg
            </li>
          </ol>
        }
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
