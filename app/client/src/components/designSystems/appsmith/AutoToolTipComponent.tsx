import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "components/designSystems/appsmith/TableStyledWrappers";

const AutoToolTipComponent = (props: {
  isHidden?: boolean;
  children: React.ReactNode;
  title: string;
  tableWidth?: number;
  widgetId?: string;
}) => {
  const ref = createRef<HTMLDivElement>();
  const [useToolTip, updateToolTip] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element && element.offsetWidth < element.scrollWidth) {
      updateToolTip(true);
    } else {
      updateToolTip(false);
    }
  }, [ref]);
  const boundariesElement = props.widgetId
    ? document.getElementById(props.widgetId)
    : undefined;
  console.log({ boundariesElement });
  return (
    <CellWrapper ref={ref} isHidden={props.isHidden}>
      {useToolTip && props.children ? (
        <Tooltip
          autoFocus={false}
          hoverOpenDelay={1000}
          content={
            <div
              style={{
                wordBreak: "break-all",
                width: `${(props.tableWidth || 300) - 32}px`,
              }}
            >
              {props.title}
            </div>
          }
          position="top"
        >
          {props.children}
        </Tooltip>
      ) : (
        props.children
      )}
    </CellWrapper>
  );
};

export default AutoToolTipComponent;
