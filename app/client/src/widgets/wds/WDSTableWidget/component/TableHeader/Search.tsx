import React from "react";
import { TextInput } from "@design-system/widgets";

export interface SearchProps {
  isVisibleSearch?: boolean;
  searchKey: string;
  onSearch: (searchKey: string) => void;
}

export const Search = (props: SearchProps) => {
  const { isVisibleSearch, onSearch, searchKey } = props;

  return isVisibleSearch ? (
    <TextInput
      onChange={onSearch}
      placeholder="Search..."
      size="small"
      value={searchKey}
    />
  ) : null;
};
