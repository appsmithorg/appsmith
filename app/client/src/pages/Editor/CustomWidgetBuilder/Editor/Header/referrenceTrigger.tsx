import { Icon } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";

export default function ReferrenceTrigger() {
  const context = useContext(CustomWidgetBuilderContext);

  const onClick = () => {
    context.toggleReferrence?.();
  };

  return (
    <div className={styles.referrenceTrigger} onClick={onClick}>
      <div>Referrences</div>
      <div>
        <Icon
          name={context.isReferrenceOpen ? "eye-on" : "eye-off"}
          size="md"
        />
      </div>
    </div>
  );
}
