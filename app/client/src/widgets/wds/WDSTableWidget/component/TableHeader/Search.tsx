import React from "react";
import { TextField } from "@appsmith/wds";

export interface SearchProps {
  isVisibleSearch?: boolean;
  searchKey: string;
  onSearch: (searchKey: string) => void;
  excludeFromTabOrder?: boolean;
}

export const Search = (props: SearchProps) => {
  const { excludeFromTabOrder, isVisibleSearch, onSearch, searchKey } = props;

  return isVisibleSearch ? (
    <TextField
      excludeFromTabOrder={excludeFromTabOrder}
      onChange={onSearch}
      placeholder="Search..."
      size="small"
      value={searchKey}
    />
  ) : null;
};
