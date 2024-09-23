import type { PropsWithChildren } from "react";
import React from "react";
import { Flex } from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";
import { formatBytes } from "../../utils/helpers";
import { isEmpty } from "lodash";
import BindDataButton from "pages/Editor/QueryEditor/BindDataButton";
import styled from "styled-components";
import type { ActionResponse } from "api/ActionAPI";
import { Text as BlueprintText } from "@blueprintjs/core/lib/esm/components/text/text";

interface TextStyleProps {
  accent: "primary" | "secondary" | "error";
}

const BaseText = styled(BlueprintText)<TextStyleProps>``;
const ResponseMetaInfo = styled.div`
  display: flex;
  ${BaseText} {
    color: var(--ads-v2-color-fg);
    margin-left: ${(props) => props.theme.spaces[9]}px;
  }

  & [type="p3"] {
    color: var(--ads-v2-color-fg-muted);
  }

  & [type="h5"] {
    color: var(--ads-v2-color-fg);
  }
`;

const ResponseMetaWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: var(--ads-v2-spaces-3);
  border-bottom: 1px solid var(--ads-v2-color-border);
  height: 40px;
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 20px;

  span:first-child {
    margin-right: ${(props) => props.theme.spaces[1] + 1}px;
  }
`;

const StatusCodeText = styled(BaseText)<PropsWithChildren<{ code: string }>>`
  color: ${(props) =>
    props.code.startsWith("2")
      ? "var(--ads-v2-color-fg-success)"
      : "var(--ads-v2-color-fg-error)"};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    width: 100%;
  }
`;

interface Props {
  actionResponse?: ActionResponse;
  actionName?: string;
}

const ApiResponseMeta = (props: Props) => {
  const { actionName, actionResponse } = props;

  if (!actionResponse || !actionResponse.statusCode) return null;

  return (
    <ResponseMetaWrapper>
      <Flex>
        {actionResponse.statusCode && (
          <FlexContainer>
            <Text type={TextType.P3}>Status: </Text>
            <StatusCodeText
              accent="secondary"
              className="t--response-status-code"
              code={actionResponse.statusCode.toString()}
            >
              {actionResponse.statusCode}
            </StatusCodeText>
          </FlexContainer>
        )}
        <ResponseMetaInfo>
          {actionResponse.duration && (
            <FlexContainer>
              <Text type={TextType.P3}>Time: </Text>
              <Text type={TextType.H5}>{actionResponse.duration} ms</Text>
            </FlexContainer>
          )}
          {actionResponse.size && (
            <FlexContainer>
              <Text type={TextType.P3}>Size: </Text>
              <Text type={TextType.H5}>
                {formatBytes(parseInt(actionResponse.size))}
              </Text>
            </FlexContainer>
          )}
          {!isEmpty(actionResponse?.body) &&
            Array.isArray(actionResponse?.body) && (
              <FlexContainer>
                <Text type={TextType.P3}>Result: </Text>
                <Text type={TextType.H5}>
                  {`${actionResponse?.body.length} Record${
                    actionResponse?.body.length > 1 ? "s" : ""
                  }`}
                </Text>
              </FlexContainer>
            )}
        </ResponseMetaInfo>
      </Flex>
      <BindDataButton
        actionName={actionName || ""}
        hasResponse={!!actionResponse}
        suggestedWidgets={actionResponse.suggestedWidgets}
      />
    </ResponseMetaWrapper>
  );
};

export default ApiResponseMeta;
