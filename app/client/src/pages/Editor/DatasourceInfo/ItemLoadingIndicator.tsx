import React from "react";
import {
  createMessage,
  GSHEET_DATA_LOADING,
  GSHEET_SHEET_LOADING,
  GSHEET_SPREADSHEET_LOADING,
  LOADING_SCHEMA,
} from "ee/constants/messages";
import { Spinner, Text } from "@appsmith/ads";
import { MessageWrapper } from "./SchemaViewModeCSS";

type LoadingItemType = "SPREADSHEET" | "SHEET" | "DATA" | "SCHEMA";

const ItemLoadingIndicator = ({ type }: { type: LoadingItemType }) => {
  return (
    <MessageWrapper
      className={`t--item-loading-indicator t--item-loading-indicator--${type.toLowerCase()}`}
    >
      <Spinner size="md" />
      <Text style={{ marginLeft: "8px" }}>
        {createMessage(
          type === "SPREADSHEET"
            ? GSHEET_SPREADSHEET_LOADING
            : type === "SHEET"
              ? GSHEET_SHEET_LOADING
              : type === "SCHEMA"
                ? LOADING_SCHEMA
                : GSHEET_DATA_LOADING,
        )}
      </Text>
    </MessageWrapper>
  );
};

export default ItemLoadingIndicator;
