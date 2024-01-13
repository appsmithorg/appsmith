import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from ".";
import styles from "./styles.module.css";

export default function ConnectionLost() {
  const { showConnectionLostMessage } = useContext(CustomWidgetBuilderContext);

  if (showConnectionLostMessage) {
    return <div className={styles.connectionLostContainer} />;
  } else {
    return null;
  }
}
