import React, { forwardRef } from "react";

import { SearchInput } from "@appsmith/ads";
import * as Styles from "./SearchAndAdd.styles";
import type { SearchAndAddProps } from "./SearchAndAdd.types";

export const SearchAndAdd = forwardRef<HTMLInputElement, SearchAndAddProps>(
  (props, ref) => {
    const {
      onAdd,
      onSearch,
      placeholder,
      searchTerm = "",
      showAddButton,
    } = props;

    return (
      <Styles.Root>
        <SearchInput
          onChange={onSearch}
          placeholder={placeholder}
          ref={ref}
          size="sm"
          value={searchTerm}
        />
        {showAddButton && (
          <Styles.SquareButton
            aria-label="Add"
            isIconButton
            kind="secondary"
            onClick={onAdd}
            size="sm"
            startIcon="add-line"
          />
        )}
      </Styles.Root>
    );
  },
);

SearchAndAdd.displayName = "SearchAndAdd";
