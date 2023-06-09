import React from "react";
import { PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE } from "@appsmith/constants/messages";
import { Icon } from "design-system";

export function EmptySearchResult() {
  return (
    <div className="mt-12 p-3 t--property-pane-no-search-results">
      <Icon className="flex justify-center" name="search" size="lg" />
      <p className="pt-3 text-center">
        {PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE}
      </p>
    </div>
  );
}
