import React from "react";
import ColumnDropdown from "./ColumnDropdown";
import { noop } from "lodash";

type Props = {
  hasSearchableColumn?: boolean;
  aliases?: string[];
};

export default function WidgetSpecificControls(props: Props) {
  let searchableColumn = null;
  let aliases = null;

  if (props.hasSearchableColumn) {
    searchableColumn = (
      <ColumnDropdown
        alias="searchableColumn"
        label="Select a searchable column"
        onSelect={noop}
      />
    );
  }

  if (props.aliases?.length) {
    aliases = props.aliases.map((alias) => (
      <ColumnDropdown
        alias={`alias.${alias}`}
        key={alias}
        label={alias}
        onSelect={noop}
      />
    ));
  }

  return (
    <>
      {searchableColumn}
      {aliases}
    </>
  );
}
