import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import TableColumnHeader from "../header/TableColumnHeader";
import { useAppsmithTable } from "../TableContext";
import { StaticTableBodyComponent } from "./StaticTableBodyComponent";

interface StaticTableProps {}
const StaticTable = (_: StaticTableProps, ref: React.Ref<SimpleBar>) => {
  const { scrollContainerStyles } = useAppsmithTable();

  return (
    <SimpleBar ref={ref} style={scrollContainerStyles}>
      <TableColumnHeader />
      <StaticTableBodyComponent />
    </SimpleBar>
  );
};

export default React.forwardRef(StaticTable);
