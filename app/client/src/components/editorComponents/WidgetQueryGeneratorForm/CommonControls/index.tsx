import React from "react";
import DatasourceDropdown from "./DatasourceDropdown";
import TableOrSpreadsheetDropdown from "./TableOrSpreadsheetDropdown";

export function CommonControls() {
  return (
    <>
      <DatasourceDropdown />
      <TableOrSpreadsheetDropdown />
    </>
  );
}
