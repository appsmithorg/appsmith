import React from "react";
import DatasourceDropdown from "./DatasourceDropdown";
import TableOrSpreadsheetDropdown from "./TableOrSpreadsheetDropdown";

type CommonControlsProps = {
  allowFieldConfig: boolean;
};

export function CommonControls(props: CommonControlsProps) {
  return (
    <>
      <DatasourceDropdown />
      <TableOrSpreadsheetDropdown allowFieldConfig={props.allowFieldConfig} />
    </>
  );
}
