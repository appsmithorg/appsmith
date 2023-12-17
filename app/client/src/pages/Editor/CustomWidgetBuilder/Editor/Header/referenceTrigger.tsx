import { Icon, Tooltip } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";

export default function ReferenceTrigger() {
  const { isReferenceOpen, toggleReference } = useContext(
    CustomWidgetBuilderContext,
  );

  const onClick = () => {
    toggleReference?.();
  };

  return (
    <div className={styles.referenceTrigger} onClick={onClick}>
      <div>References</div>
      <div>
        <Tooltip
          content={isReferenceOpen ? "Close references" : "Open references"}
          placement="left"
        >
          <Icon name={isReferenceOpen ? "eye-on" : "eye-off"} size="md" />
        </Tooltip>
      </div>
    </div>
  );
}
