import React from "react";
import { PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE } from "ee/constants/messages";
import { Icon } from "@appsmith/ads";

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
