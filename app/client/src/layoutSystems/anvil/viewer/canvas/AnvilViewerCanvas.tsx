import React, { useMemo } from "react";
import styles from "./styles.module.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";
import { AnvilDetachedWidgets } from "./AnvilDetachedWidgets";
import styled from "styled-components";
import { APP_MAX_WIDTH, type AppMaxWidth } from "@appsmith/wds-theming";

const appMaxWidthToCSSValue = (maxWidth: AppMaxWidth): string => {
  switch (maxWidth) {
    case APP_MAX_WIDTH.Unlimited:
      return "auto";
    case APP_MAX_WIDTH.Large:
      return "1080px";
    case APP_MAX_WIDTH.Medium:
      return "800px";
    default: {
      const exhaustiveCheck: never = maxWidth;
      throw new Error(`Unhandled maxWidth: ${exhaustiveCheck}`);
    }
  }
};

const RootStyled = styled.div<{
  maxWidth?: AppMaxWidth;
}>`
  max-width: ${({ maxWidth }) =>
    maxWidth ? `${appMaxWidthToCSSValue(maxWidth)}` : "auto"};
  margin: ${({ maxWidth }) => (maxWidth ? "0 auto" : "inherit")};
`;

export const AnvilViewerCanvas = React.forwardRef(
  (props: BaseWidgetProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const className: string = useMemo(
      () => `${props.classList?.join(" ")} ${styles["anvil-canvas"]}`,
      [props.classList],
    );

    return (
      <>
        <AnvilDetachedWidgets />
        <RootStyled
          className={className}
          id={getAnvilCanvasId(props.widgetId)}
          maxWidth={props.maxWidth}
          ref={ref}
          tabIndex={0} //adding for accessibility in test cases.
        >
          <LayoutProvider {...props} />
        </RootStyled>
      </>
    );
  },
);
