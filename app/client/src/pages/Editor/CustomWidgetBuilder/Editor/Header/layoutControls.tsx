import { SegmentedControl } from "design-system";
import React, { useContext } from "react";
import { CustomWidgetBuilderContext } from "../..";
import styles from "./styles.module.css";
import styled from "styled-components";

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
            label: "Split",
            startIcon: "layout-column-line",
            value: "split",
          },
          {
            label: "Tabs",
            startIcon: "layout-left-2-line",
            value: "tabs",
          },
        ]}
        value={context.selectedLayout}
      />
    </div>
  );
}
