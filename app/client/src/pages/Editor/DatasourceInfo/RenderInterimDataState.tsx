import React from "react";
import { Spinner, Text } from "@appsmith/ads";
import {
  EMPTY_TABLE_TITLE_TEXT,
  EMPTY_TABLE_MESSAGE_TEXT,
  createMessage,
  LOADING_RECORDS_MESSAGE_TEXT,
  LOADING_RECORDS_TITLE_TEXT,
  FAILED_RECORDS_MESSAGE_TEXT,
  FAILED_RECORDS_TITLE_TEXT,
  NO_COLUMNS_MESSAGE_TEXT,
} from "ee/constants/messages";
import { MessageWrapper, SchemaStateMessageWrapper } from "./SchemaViewModeCSS";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

type InterimState = "LOADING" | "NODATA" | "FAILED" | "NOCOLUMNS";

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
              src={getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`)}
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
              src={getAssetUrl(`${ASSETS_CDN_URL}/failed-state.svg`)}
            />
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(FAILED_RECORDS_TITLE_TEXT)}
            </Text>
            <Text>{createMessage(FAILED_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "LOADING" ? (
          <>
            <Spinner size="md" />
            <Text style={{ fontWeight: "bold" }}>
              {createMessage(LOADING_RECORDS_TITLE_TEXT)}
            </Text>
            <Text>{createMessage(LOADING_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "NOCOLUMNS" ? (
          <>
            <img
              alt={createMessage(EMPTY_TABLE_TITLE_TEXT)}
              src={getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`)}
            />
            <Text>{createMessage(NO_COLUMNS_MESSAGE_TEXT)}</Text>
          </>
        ) : null}
      </SchemaStateMessageWrapper>
    </MessageWrapper>
  );
};

export default RenderInterimDataState;
