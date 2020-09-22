import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "components/designSystems/appsmith/TableStyledWrappers";
import { CellLayoutProperties } from "widgets/TableWidget";

const AutoToolTipComponent = (props: {
  isHidden?: boolean;
  children: React.ReactNode;
  title: string;
  cellProperties?: CellLayoutProperties;
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
  return (
    <CellWrapper
      ref={ref}
      isHidden={props.isHidden}
      cellProperties={props.cellProperties}
    >
      {useToolTip && props.children ? (
        <Tooltip
          autoFocus={false}
          hoverOpenDelay={1000}
          content={props.title}
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
