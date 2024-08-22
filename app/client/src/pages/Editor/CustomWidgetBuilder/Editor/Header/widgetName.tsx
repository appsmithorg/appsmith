import React, { useContext } from "react";

import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";

export default function WidgetName() {
  const { name } = useContext(CustomWidgetBuilderContext);

  return <div className={styles.widgetName}>{name}</div>;
}
