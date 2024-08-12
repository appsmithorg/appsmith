import React from "react";
import styles from "./styles.module.css";
import Collapsible from "./collapsible";
import Help from "./help";
import LiveModel from "./liveModel";
import Events from "./events";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";

export default function References() {
  return (
    <div className={styles.references}>
      <Collapsible
        helpMessage={
          <ol>
            <li>
              {createMessage(
                CUSTOM_WIDGET_FEATURE.referrences.liveModel.helpMessage[0],
              )}
            </li>
            <li>
              {createMessage(
                CUSTOM_WIDGET_FEATURE.referrences.liveModel.helpMessage[1],
              )}
            </li>
          </ol>
        }
        label={createMessage(CUSTOM_WIDGET_FEATURE.referrences.liveModel.label)}
      >
        <LiveModel />
      </Collapsible>
      <Collapsible
        helpMessage={
          <ol>
            <li>
              {createMessage(
                CUSTOM_WIDGET_FEATURE.referrences.events.helpMessage[0],
              )}
            </li>
            <li>
              {createMessage(
                CUSTOM_WIDGET_FEATURE.referrences.events.helpMessage[1],
              )}
            </li>
          </ol>
        }
        label={createMessage(CUSTOM_WIDGET_FEATURE.referrences.events.label)}
      >
        <Events />
      </Collapsible>
      <Collapsible label="Help">
        <Help />
      </Collapsible>
    </div>
  );
}
