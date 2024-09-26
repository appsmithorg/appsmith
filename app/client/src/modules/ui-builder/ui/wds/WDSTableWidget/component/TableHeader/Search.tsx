import React from "react";
import { TextInput } from "@appsmith/wds";

export interface SearchProps {
  isVisibleSearch?: boolean;
  searchKey: string;
  onSearch: (searchKey: string) => void;
  excludeFromTabOrder?: boolean;
}

export const Search = (props: SearchProps) => {
  const { excludeFromTabOrder, isVisibleSearch, onSearch, searchKey } = props;

  return isVisibleSearch ? (
    <TextInput
      excludeFromTabOrder={excludeFromTabOrder}
      onChange={onSearch}
      placeholder="Search..."
      size="small"
      value={searchKey}
    />
  ) : null;
};
