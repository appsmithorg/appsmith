import { Icon } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";

export default function ReferenceTrigger() {
  const context = useContext(CustomWidgetBuilderContext);

  const onClick = () => {
    context.toggleReference?.();
  };

  return (
    <div className={styles.referenceTrigger} onClick={onClick}>
      <div>References</div>
      <div>
        <Icon name={context.isReferenceOpen ? "eye-on" : "eye-off"} size="md" />
      </div>
    </div>
  );
}
