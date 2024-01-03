import { Icon, Tooltip } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

export default function ReferenceTrigger() {
  const { isReferenceOpen, toggleReference } = useContext(
    CustomWidgetBuilderContext,
  );

  const onClick = () => {
    toggleReference?.();
  };

  return (
    <div className={styles.referenceTrigger} onClick={onClick}>
      <div>{createMessage(CUSTOM_WIDGET_FEATURE.referrences.title)}</div>
      <div>
        <Tooltip
          content={
            isReferenceOpen
              ? createMessage(CUSTOM_WIDGET_FEATURE.referrences.tooltip.close)
              : createMessage(CUSTOM_WIDGET_FEATURE.referrences.tooltip.open)
          }
          placement="left"
        >
          <Icon name={isReferenceOpen ? "eye-on" : "eye-off"} size="md" />
        </Tooltip>
      </div>
    </div>
  );
}
