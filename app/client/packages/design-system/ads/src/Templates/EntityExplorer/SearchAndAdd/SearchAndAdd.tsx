import React, { forwardRef } from "react";

import { SearchInput } from "../../../SearchInput";
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
          data-testid="t--search-input"
          onChange={onSearch}
          placeholder={placeholder}
          ref={ref}
          size="sm"
          value={searchTerm}
        />
        {showAddButton && (
          <Styles.SquareButton
            aria-label="Add"
            data-testid="t--add-item"
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
