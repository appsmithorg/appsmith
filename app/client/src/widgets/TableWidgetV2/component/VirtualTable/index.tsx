import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { useAppsmithTable } from "../TableContext";
import InfiniteScrollBodyComponent from "./InifiniteScrollBody";
import VirtualTableBodyComponent from "./VirtualTableBodyComponent";
import VirtualTableInnerElement from "./VirtualTableInnerElement";

interface VirtualTableProps {}
const VirtualTable = (_: VirtualTableProps, ref: React.Ref<SimpleBar>) => {
  const { isInfiniteScrollEnabled, scrollContainerStyles } = useAppsmithTable();

  return (
    <SimpleBar ref={ref} style={scrollContainerStyles}>
      {({ scrollableNodeRef }) =>
        isInfiniteScrollEnabled ? (
          <InfiniteScrollBodyComponent
            innerElementType={VirtualTableInnerElement}
            ref={scrollableNodeRef}
          />
        ) : (
          <VirtualTableBodyComponent
            innerElementType={VirtualTableInnerElement}
            ref={scrollableNodeRef}
          />
        )
      }
    </SimpleBar>
  );
};

export default React.forwardRef(VirtualTable);
