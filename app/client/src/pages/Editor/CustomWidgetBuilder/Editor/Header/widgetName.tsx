import React, { useContext } from "react";
import styles from "./styles.module.css";
import { CustomWidgetBuilderContext } from "../..";

export default function WidgetName() {
  const { name } = useContext(CustomWidgetBuilderContext);

  return <div className={styles.widgetName}>{name}</div>;
}
