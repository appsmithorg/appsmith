import { SegmentedControl } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import styled from "styled-components";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

const StyledSegmentedControl = styled(SegmentedControl)`
  & .ads-v2-icon {
    transform: rotate(90deg);
  }
`;

export default function LayoutControls() {
  const context = useContext(CustomWidgetBuilderContext);

  const onChange = (value: string) => {
    context.selectLayout?.(value);
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
        value={context.selectedLayout}
      />
    </div>
  );
}
