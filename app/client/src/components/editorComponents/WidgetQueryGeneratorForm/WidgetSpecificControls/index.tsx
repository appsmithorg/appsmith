import React from "react";
import ColumnDropdown from "./ColumnDropdown";
import { noop } from "lodash";

type Props = {
  hasSearchableColumn?: boolean;
  hasAliasPicker?: boolean;
  aliases?: string[];
};

export default function WidgetSpecificControls(props: Props) {
  let searchableColumn = null;
  let aliasPicker = null;

  if (props.hasSearchableColumn) {
    searchableColumn = (
      <ColumnDropdown
        alias="searchableColumn"
        label="Select a searchable column"
        onSelect={noop}
      />
    );
  }

  if (props.hasAliasPicker && props.aliases) {
    aliasPicker = props.aliases.map((alias) => {
      <ColumnDropdown alias={`alias.${alias}`} label={alias} onSelect={noop} />;
    });
  }

  return (
    <>
      {searchableColumn}
      {aliasPicker}
    </>
  );
}
