import React from "react";
import EmptyTableSVG from "assets/images/empty-table-in-display-preview.svg";
import { Text } from "design-system";
import {
  EMPTY_TABLE_TITLE_TEXT,
  EMPTY_TABLE_MESSAGE_TEXT,
  createMessage,
  EMPTY_TABLE_SVG_ALT_TEXT, LOADING_RECORDS_MESSAGE_TEXT, LOADING_RECORDS_TITLE_TEXT,
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
  border: 1px solid #A9A9A9;
  border-radius: .50em;
  height: 8px;
  margin-bottom: 2em;
  width: 200px;
  background-image: repeating-linear-gradient(
    -45deg,
    #DCDCDC,
    #DCDCDC 9px,
    #fff 12px, 
    #fff 15px
  );
  -webkit-animation: ${indeterminateProgressBarAnimation} 1s linear infinite;
  -moz-animation: ${indeterminateProgressBarAnimation} 1s linear infinite;
  animation: ${indeterminateProgressBarAnimation} 1.5s linear infinite;
  background-size: 200% 100%;
`;

const TestPB = () => {
  return (
    <IndeterminateProgressBarDiv/>
  );
};

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
          // <Text color="var(--ads-color-red-500)">
          //   {createMessage(ERR_FETCHING_DATASOURCE_PREVIEW_DATA)}
          // </Text>
          //<TestPB/>
          <>
          <IndeterminateProgressBarDiv />
          {/* Show title */}
          <Text style={{ fontWeight: "bold" }}>
          {createMessage(LOADING_RECORDS_TITLE_TEXT)}
          </Text>
          {/* Show description */}
          <Text>{createMessage(LOADING_RECORDS_MESSAGE_TEXT)}</Text>
          </>
        ) : state === "LOADING" ? (
          <>
            {/*<Spinner size="md" />*/}
            {/*<Text style={{ marginLeft: "8px" }}>*/}
            {/*  {createMessage(FETCHING_DATASOURCE_PREVIEW_DATA)}*/}
            {/*</Text>*/}
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
