import React, { type Ref } from "react";
import type { ReactElementType } from "react-window";
import { FixedVirtualList } from "../TableBodyCoreComponents/VirtualList";
import { useAppsmithTable } from "../TableContext";
import type SimpleBar from "simplebar-react";

interface VirtualTableBodyComponentProps {
  innerElementType: ReactElementType;
}

const VirtualTableBodyComponent = React.forwardRef(
  (props: VirtualTableBodyComponentProps, ref: Ref<SimpleBar>) => {
    const { height, pageSize, subPage: rows, tableSizes } = useAppsmithTable();

    return (
      <div className="simplebar-content-wrapper">
        <FixedVirtualList
          height={height}
          innerElementType={props.innerElementType}
          itemCount={rows.length}
          outerRef={ref}
          pageSize={pageSize}
          rows={rows}
          tableSizes={tableSizes}
        />
      </div>
    );
  },
);

export default VirtualTableBodyComponent;
