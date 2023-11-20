import React from "react";
import EmptyTableSVG from "assets/images/empty-table.svg";
import FailedDataSVG from "assets/images/failed-data.svg";
import ProgressSVG from "assets/images/progress.svg";
import { Text } from "design-system";
import {
  EMPTY_TABLE_TITLE_TEXT,
  EMPTY_TABLE_MESSAGE_TEXT,
  createMessage,
  LOADING_RECORDS_MESSAGE_TEXT,
  LOADING_RECORDS_TITLE_TEXT,
  FAILED_RECORDS_MESSAGE_TEXT,
  FAILED_RECORDS_TITLE_TEXT,
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
            <img
              alt={createMessage(EMPTY_TABLE_TITLE_TEXT)}
              src={EmptyTableSVG}
            />
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(EMPTY_TABLE_TITLE_TEXT)}
            </Text>
            <Text>{createMessage(EMPTY_TABLE_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "FAILED" ? (
          <>
            <img
              alt={createMessage(FAILED_RECORDS_TITLE_TEXT)}
              src={FailedDataSVG}
            />
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(FAILED_RECORDS_TITLE_TEXT)}
            </Text>
            <Text>{createMessage(FAILED_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "LOADING" ? (
          <>
            <img
              alt={createMessage(LOADING_RECORDS_TITLE_TEXT)}
              src={ProgressSVG}
            />
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(LOADING_RECORDS_TITLE_TEXT)}
            </Text>
            <Text>{createMessage(LOADING_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : null}
      </SchemaStateMessageWrapper>
    </MessageWrapper>
  );
};

export default RenderInterimDataState;
