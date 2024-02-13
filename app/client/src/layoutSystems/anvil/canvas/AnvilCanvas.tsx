import React, { useMemo } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { getAnvilCanvasId } from "./utils";
import { LayoutProvider } from "../layoutComponents/LayoutProvider";
import { useRenderDetachedChildren } from "../common/hooks/detachedWidgetHooks";

export const AnvilCanvas = React.forwardRef(
  (props: BaseWidgetProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const className: string = useMemo(
      () => `anvil-canvas ${props.classList?.join(" ")}`,
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
