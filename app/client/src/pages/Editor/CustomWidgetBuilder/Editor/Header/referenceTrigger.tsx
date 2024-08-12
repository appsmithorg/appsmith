import { Icon, Tooltip } from "@appsmith/ads";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export default function ReferenceTrigger() {
  const { isReferenceOpen, toggleReference, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const onClick = () => {
    toggleReference?.();

    AnalyticsUtil.logEvent(
      "CUSTOM_WIDGET_BUILDER_REFERENCE_VISIBILITY_CHANGED",
      {
        widgetId: widgetId,
        visible: !isReferenceOpen,
      },
    );
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
