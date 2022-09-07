import React from "react";
import { IconNames } from "@blueprintjs/icons";
import { Icon, IconSize } from "components/ads";
import { EmptySearchResultWrapper } from "./Generator";
import { PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE } from "ce/constants/messages";

export function EmptySearchResult() {
  return (
    <EmptySearchResultWrapper className="mt-12 p-3">
      <Icon
        className="flex justify-center"
        name={IconNames.SEARCH}
        size={IconSize.XXXL}
      />
      <p className="pt-3 text-center">
        {PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE}
      </p>
    </EmptySearchResultWrapper>
  );
}
