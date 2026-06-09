import React, { useCallback, useMemo } from "react";
import copy from "copy-to-clipboard";
import styled from "styled-components";

import type { ActionResponse } from "api/ActionAPI";
import { Button, Callout, Flex, toast } from "@appsmith/ads";
import { CHECK_REQUEST_BODY, createMessage } from "ee/constants/messages";
import { isArray, isEmpty } from "lodash";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { hasFailed } from "../utils";
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

const HeadersToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: var(--ads-v2-spaces-2);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const HeadersEditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
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

  const headersInput = useMemo(() => {
    return {
      value: !isEmpty(responseHeaders)
        ? JSON.stringify(responseHeaders, null, 2)
        : "",
    };
  }, [responseHeaders]);

  const copyResponseHeaders = useCallback(() => {
    copy(headersInput.value);
    toast.show("Response headers copied to clipboard", {
      kind: "success",
    });
  }, [headersInput.value]);

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
        <Callout kind="error">{createMessage(CHECK_REQUEST_BODY)}</Callout>
      )}
      {!runHasFailed && (
        <ResponseDataContainer>
          {isEmpty(props.actionResponse.statusCode) ? (
            <NoResponse
              isRunDisabled={props.isRunDisabled}
              isRunning={props.isRunning}
              onRunClick={props.onRunClick}
            />
          ) : (
            <>
              <HeadersToolbar>
                <Button
                  isDisabled={isEmpty(headersInput.value)}
                  kind="tertiary"
                  onClick={copyResponseHeaders}
                  size="sm"
                  startIcon="copy-control"
                >
                  Copy headers
                </Button>
              </HeadersToolbar>
              <HeadersEditorWrapper>
                <ReadOnlyEditor folding height={"100%"} input={headersInput} />
              </HeadersEditorWrapper>
            </>
          )}
        </ResponseDataContainer>
      )}
    </Flex>
  );
}
