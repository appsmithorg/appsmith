import React, { useMemo } from "react";
import styles from "./styles.module.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { AnvilCanvasClassName } from "widgets/anvil/constants";
import { useRenderDetachedChildren } from "layoutSystems/anvil/common/hooks/detachedWidgetHooks";
import { LayoutProvider } from "layoutSystems/anvil/layoutComponents/LayoutProvider";

export const AnvilViewerCanvas = React.forwardRef(
  (props: BaseWidgetProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const className: string = useMemo(
      () => `${styles[AnvilCanvasClassName]} ${props.classList?.join(" ")}`,
      [props.classList],
    );

    const renderDetachedChildren = useRenderDetachedChildren(
      props.widgetId,
      props.children,
    );

    return (
      <>
        {renderDetachedChildren}
        <div
          className={className}
          id={getAnvilCanvasId(props.widgetId)}
          ref={ref}
          tabIndex={0} //adding for accessibility in test cases.
        >
          <LayoutProvider {...props} />
        </div>
      </>
    );
  },
);
