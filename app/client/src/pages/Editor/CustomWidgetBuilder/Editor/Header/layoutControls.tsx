import { SegmentedControl } from "@appsmith/ads";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import styled from "styled-components";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledSegmentedControl = styled(SegmentedControl)`
  & .ads-v2-icon {
    transform: rotate(90deg);
  }
`;

export default function LayoutControls() {
  const { selectedLayout, selectLayout, widgetId } = useContext(
    CustomWidgetBuilderContext,
  );

  const onChange = (value: string) => {
    selectLayout?.(value);

    AnalyticsUtil.logEvent("CUSTOM_WIDGET_BUILDER_LAYOUT_CHANGED", {
      widgetId: widgetId,
      layoutName: value,
    });
  };

  return (
    <div className={styles.layoutControl}>
      <StyledSegmentedControl
        onChange={onChange}
        options={[
          {
            label: createMessage(CUSTOM_WIDGET_FEATURE.layout.split),
            startIcon: "layout-column-line",
            value: "split",
          },
          {
            label: createMessage(CUSTOM_WIDGET_FEATURE.layout.tab),
            startIcon: "layout-left-2-line",
            value: "tabs",
          },
        ]}
        value={selectedLayout}
      />
    </div>
  );
}
