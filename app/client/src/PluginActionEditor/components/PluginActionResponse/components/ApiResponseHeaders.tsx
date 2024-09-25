import React, { useMemo } from "react";
import type { ActionResponse } from "api/ActionAPI";
import { Callout, Flex } from "@appsmith/ads";
import { CHECK_REQUEST_BODY, createMessage } from "ee/constants/messages";
import { isArray, isEmpty } from "lodash";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { hasFailed } from "../utils";
import styled from "styled-components";
import { NoResponse } from "./NoResponse";

const ResponseDataContainer = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;

  & .CodeEditorTarget {
    overflow: hidden;
  }
`;

const headersTransformer = (headers: Record<string, string[]> = {}) => {
  let responseHeaders = {};

  // if no headers are present in the response, use the default body text.
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (isArray(value) && value.length < 2) {
        responseHeaders = {
          ...responseHeaders,
          [key]: value[0],
        };

        return;
      }

      responseHeaders = {
        ...responseHeaders,
        [key]: value,
      };
    });
  }

  return responseHeaders;
};

export function ApiResponseHeaders(props: {
  isRunning: boolean;
  onDebugClick: () => void;
  actionResponse?: ActionResponse;
  isRunDisabled: boolean;
  onRunClick: () => void;
}) {
  const responseHeaders = useMemo(() => {
    return headersTransformer(props.actionResponse?.headers);
  }, [props.actionResponse?.headers]);

  const errorCalloutLinks = useMemo(() => {
    return [
      {
        children: "Debug",
        endIcon: "bug",
        onClick: props.onDebugClick,
        to: "",
      },
    ];
  }, [props.onDebugClick]);

  const headersInput = useMemo(() => {
    return {
      value: !isEmpty(responseHeaders)
        ? JSON.stringify(responseHeaders, null, 2)
        : "",
    };
  }, [responseHeaders]);

  if (!props.actionResponse) {
    return (
      <Flex className="t--headers-tab" h="100%" w="100%">
        <NoResponse
          isRunDisabled={props.isRunDisabled}
          isRunning={props.isRunning}
          onRunClick={props.onRunClick}
        />
      </Flex>
    );
  }

  const runHasFailed = hasFailed(props.actionResponse);

  return (
    <Flex className="t--headers-tab" flexDirection="column" h="100%" w="100%">
      {runHasFailed && !props.isRunning && (
        <Callout kind="error" links={errorCalloutLinks}>
          {createMessage(CHECK_REQUEST_BODY)}
        </Callout>
      )}
      <ResponseDataContainer>
        {isEmpty(props.actionResponse.statusCode) ? (
          <NoResponse
            isRunDisabled={props.isRunDisabled}
            isRunning={props.isRunning}
            onRunClick={props.onRunClick}
          />
        ) : (
          <ReadOnlyEditor folding height={"100%"} input={headersInput} />
        )}
      </ResponseDataContainer>
    </Flex>
  );
}
