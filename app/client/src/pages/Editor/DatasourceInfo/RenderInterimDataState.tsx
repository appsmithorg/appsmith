import React from "react";
import EmptyTableSVG from "assets/images/empty-table-in-display-preview.svg";
import { Spinner, Text } from "design-system";
import {
  EMPTY_TABLE_TITLE_TEXT,
  EMPTY_TABLE_MESSAGE_TEXT,
  createMessage,
  EMPTY_TABLE_SVG_ALT_TEXT,
  LOADING_RECORDS_MESSAGE_TEXT,
  LOADING_RECORDS_TITLE_TEXT,
  ERR_FETCHING_DATASOURCE_PREVIEW_DATA,
} from "@appsmith/constants/messages";
import { MessageWrapper, SchemaStateMessageWrapper } from "./SchemaViewModeCSS";

type InterimState = "LOADING" | "NODATA" | "FAILED";

interface RenderInterimDataStateProps {
  state: InterimState;
}

const RenderInterimDataState = ({ state }: RenderInterimDataStateProps) => {
  return (
    <MessageWrapper>
      <SchemaStateMessageWrapper>
        {state === "NODATA" ? (
          <>
            {/* Render empty table image */}
            <img
              alt={createMessage(EMPTY_TABLE_SVG_ALT_TEXT)}
              src={EmptyTableSVG}
            />
            {/* Show description below the image */}
            {/* Show title */}
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(EMPTY_TABLE_TITLE_TEXT)}
            </Text>
            {/* Show description */}
            <Text>{createMessage(EMPTY_TABLE_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "FAILED" ? (
          <Text color="var(--ads-color-red-500)">
            {createMessage(ERR_FETCHING_DATASOURCE_PREVIEW_DATA)}
          </Text>
        ) : state === "LOADING" ? (
          <>
            {/* Show spinner */}
            <Spinner size="md" />
            {/* Show title */}
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(LOADING_RECORDS_TITLE_TEXT)}
            </Text>
            {/* Show description */}
            <Text>{createMessage(LOADING_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : null}
      </SchemaStateMessageWrapper>
    </MessageWrapper>
  );
};

export default RenderInterimDataState;
