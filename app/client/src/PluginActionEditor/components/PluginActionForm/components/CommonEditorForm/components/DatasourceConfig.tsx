import styled from "styled-components";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
import { Button, Icon, Text, Tooltip } from "@appsmith/ads";
import {
  API_PANE_AUTO_GENERATED_HEADER,
  API_PANE_DUPLICATE_HEADER,
  createMessage,
} from "ee/constants/messages";
import React, { useState } from "react";
import { Classes } from "@appsmith/ads-old";

const Flex = styled.div<{
  size: number;
  isInvalid?: boolean;
}>`
  flex: ${(props) => props.size};
  width: 100%;
  position: relative;
  min-height: 36px;
  height: auto;
  border-color: var(--ads-v2-color-border);
  border-bottom: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  color: var(--ads-v2-color-fg);
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.possible-overflow-key,
  &.possible-overflow {
    overflow: hidden;
    text-overflow: ellipsis;
    width: fit-content;
    max-width: 100%;

    div {
      padding: 0 6px;
    }
  }

  &.possible-overflow {
    width: 0;
    max-height: 36px;

    & > span.cs-text {
      width: 100%;
    }
  }

  & span {
    ${(props) =>
      props?.isInvalid
        ? "text-decoration: line-through;"
        : "text-decoration: none;"}
  }
`;
const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 42px);

  .key-value {
    .${Classes.TEXT} {
      color: var(--ads-v2-color-fg);
      padding: ${(props) => props.theme.spaces[2]}px 0px
        ${(props) => props.theme.spaces[2]}px
        ${(props) => props.theme.spaces[5]}px;
    }

    border-bottom: 0px;
  }

  .key-value-header {
    color: var(--ads-v2-color-fg);
    border-bottom: 0px;

    &:nth-child(2) {
      margin-left: 5px;
    }
  }

  .key-value:nth-child(2) {
    margin-left: 5px;
  }

  .disabled {
    background: var(--ads-v2-color-bg-subtle);
    border: 1px solid var(--ads-v2-color-border-muted);
    margin-bottom: ${(props) => props.theme.spaces[2] - 1}px;
  }
`;
const KeyValueStackContainer = styled.div`
  padding: 0;
`;
const KeyValueFlexContainer = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px 0 0;
`;
const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;

  ${FormLabel} {
    width: 100%;
  }
`;
const CenteredIcon = styled(Icon)`
  align-self: center;
  margin-right: 5px;
`;

function ImportedKeyValue(props: {
  datas: { key: string; value: string; isInvalid?: boolean }[];
  keyValueName: string;
}) {
  return (
    <>
      {/* TODO: Fix this the next time the file is edited */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {props.datas.map((data: any, index: number) => {
        let tooltipContentValue = data?.value;
        let tooltipContentKey = data?.key;

        if ("isInvalid" in data) {
          if (data?.isInvalid) {
            tooltipContentValue = createMessage(
              API_PANE_DUPLICATE_HEADER,
              data?.key,
            );
            tooltipContentKey = createMessage(
              API_PANE_DUPLICATE_HEADER,
              data?.key,
            );
          } else {
            tooltipContentValue = "";
            tooltipContentKey = "";
          }
        }

        return (
          <FormRowWithLabel key={index}>
            <FlexContainer>
              <Flex
                className="key-value disabled possible-overflow-key"
                isInvalid={data?.isInvalid}
                size={1}
              >
                <Tooltip content={tooltipContentKey} placement="bottom">
                  <Text
                    className={`t--${props?.keyValueName}-key-${index}`}
                    kind="body-s"
                  >
                    <div>{data.key}</div>
                  </Text>
                </Tooltip>
                {"isInvalid" in data && !data?.isInvalid && (
                  <Tooltip
                    content={createMessage(API_PANE_AUTO_GENERATED_HEADER)}
                    placement="bottom"
                  >
                    <CenteredIcon
                      className={`t--auto-generated-${data.key}-info`}
                      name="question-line"
                      size="md"
                    />
                  </Tooltip>
                )}
              </Flex>
              <Flex
                className="key-value disabled possible-overflow"
                isInvalid={data?.isInvalid}
                size={3}
              >
                <Text
                  className={`t--${props?.keyValueName}-value-${index}`}
                  kind="body-s"
                >
                  <Tooltip content={tooltipContentValue} placement="bottom">
                    <div>{data.value}</div>
                  </Tooltip>
                </Text>
              </Flex>
            </FlexContainer>
          </FormRowWithLabel>
        );
      })}
    </>
  );
}

function renderImportedDatasButton(
  dataCount: number,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: any,
  showInheritedAttributes: boolean,
  attributeName: string,
) {
  return (
    // TODO: Maybe this should be a Toggle Button? ̦
    <Button
      className="t--show-imported-datas"
      kind="tertiary"
      onClick={(e) => {
        e.preventDefault();
        onClick(!showInheritedAttributes);
      }}
      size="sm"
      startIcon={showInheritedAttributes ? "eye-on" : "eye-off"}
    >
      {showInheritedAttributes
        ? `${attributeName}`
        : `${dataCount} ${attributeName}`}
    </Button>
  );
}

export function DatasourceConfig(props: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autogeneratedHeaders?: any;
  attributeName: string;
}) {
  const [showDatas, toggleDatas] = useState(false);

  // commenting this out for whenever we decide to add a button to toggle auto-generated headers
  // const [showAutoGeneratedHeader, toggleAutoGeneratedHeaders] = useState(true);
  return (
    <>
      <KeyValueFlexContainer>
        {props?.data &&
          props.data.length > 0 &&
          renderImportedDatasButton(
            props.data.length,
            toggleDatas,
            showDatas,
            `Inherited ${props.attributeName}${
              props.data.length > 1 ? "s" : ""
            }`,
          )}

        {/* commenting this out for whenever we decide to add a button to toggle auto-generated headers */}
        {/* {props?.autogeneratedHeaders &&
          props?.autogeneratedHeaders?.length > 0 &&
          renderImportedDatasButton(
            props?.autogeneratedHeaders?.length,
            toggleAutoGeneratedHeaders,
            showAutoGeneratedHeader,
            `Auto Generated Header${
              props?.autogeneratedHeaders?.length > 1 ? "s" : ""
            }`,
          )} */}
      </KeyValueFlexContainer>
      <KeyValueStackContainer>
        <FormRowWithLabel>
          <FlexContainer className="header">
            <Flex className="key-value-header" size={1}>
              <Text kind="body-m">Key</Text>
            </Flex>
            <Flex className="key-value-header" size={3}>
              <Text kind="body-m">Value</Text>
            </Flex>
          </FlexContainer>
        </FormRowWithLabel>
        {props?.data && props?.data?.length > 0 && showDatas && (
          <ImportedKeyValue
            datas={props.data}
            keyValueName={props?.attributeName}
          />
        )}
        {props?.autogeneratedHeaders &&
          props?.autogeneratedHeaders?.length > 0 && (
            <ImportedKeyValue
              datas={props.autogeneratedHeaders}
              keyValueName={"autoGeneratedHeader"}
            />
          )}
      </KeyValueStackContainer>
    </>
  );
}
