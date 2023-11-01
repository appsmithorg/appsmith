import React from "react";
import EmptyTableSVG from "assets/images/empty-table-in-display-preview.svg";
import { Text } from "design-system";
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
import styled, { keyframes } from "styled-components";

type InterimState = "LOADING" | "NODATA" | "FAILED";

interface RenderInterimDataStateProps {
  state: InterimState;
}

export const indeterminateProgressBarAnimation = keyframes`
  0% {
    background-position: -50px 0;
  }
  100% {
    background-position: 0px 0px;
  }
`;

export const IndeterminateProgressBarDiv = styled.div`
  border: 2px solid var(--ads-v2-colors-response-label-default-fg);
  border-radius: 0.5em;
  height: 12px;
  margin-bottom: 2em;
  width: 200px;
  background-image: repeating-linear-gradient(
    -45deg,
    var(--ads-v2-colors-response-surface-default-border),
    var(--ads-v2-colors-response-surface-default-border) 9px,
    var(--ads-v2-colors-response-surface-default-bg) 12px,
    var(--ads-v2-colors-response-surface-default-bg) 15px
  );
  -webkit-animation: ${indeterminateProgressBarAnimation} 1s linear infinite;
  -moz-animation: ${indeterminateProgressBarAnimation} 1s linear infinite;
  animation: ${indeterminateProgressBarAnimation} 1.5s linear infinite;
  background-size: 200% 100%;
`;

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
            {/* Show progress bar */}
            <IndeterminateProgressBarDiv />
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
