import React, { useCallback, useMemo, useState } from "react";
import { isArray, isString } from "lodash";
import { isHtml } from "../utils";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { Flex, SegmentedControl } from "@appsmith/ads";
import type { ActionResponse } from "api/ActionAPI";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { ResponseDisplayFormats } from "../../../constants/CommonApiConstants";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { ResponseFormatTabs } from "./ResponseFormatTabs";

const SegmentedControlContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  padding-top: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
`;

const ResponseBodyContainer = styled.div`
  overflow-y: clip;
  height: 100%;
  display: grid;
`;

function ApiFormatSegmentedResponse(props: {
  actionResponse: ActionResponse;
  actionId: string;
  responseTabHeight: number;
}) {
  const dispatch = useDispatch();
  const onResponseTabSelect = useCallback(
    (tab: string) => {
      dispatch(
        setActionResponseDisplayFormat({
          id: props.actionId,
          field: "responseDisplayFormat",
          value: tab,
        }),
      );
    },
    [dispatch, props.actionId],
  );

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(props.actionResponse);

  let filteredResponseDataTypes: { key: string; title: string }[] = [
    ...responseDataTypes,
  ];

  if (!!props.actionResponse.body && !isArray(props.actionResponse.body)) {
    filteredResponseDataTypes = responseDataTypes.filter(
      (item) => item.key !== ResponseDisplayFormats.TABLE,
    );

    if (responseDisplayFormat.title === ResponseDisplayFormats.TABLE) {
      onResponseTabSelect(filteredResponseDataTypes[0]?.title);
    }
  }

  const responseTabs = filteredResponseDataTypes?.map((dataType, index) => ({
    index: index,
    key: dataType.key,
    title: dataType.title,
    panelComponent: (
      <ResponseFormatTabs
        data={props.actionResponse.body as string | Record<string, unknown>[]}
        responseType={dataType.key}
        tableBodyHeight={props.responseTabHeight}
      />
    ),
  }));

  const segmentedControlOptions = responseTabs?.map((item) => ({
    value: item.key,
    label: item.title,
  }));

  const onChange = useCallback(
    (value: string) => {
      setSelectedControl(value);
      onResponseTabSelect(value);
    },
    [onResponseTabSelect],
  );

  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );

  const selectedTabIndex = filteredResponseDataTypes?.findIndex(
    (dataType) => dataType.title === responseDisplayFormat?.title,
  );

  const value = useMemo(
    () => ({ value: props.actionResponse.body as string }),
    [props.actionResponse.body],
  );

  return (
    <ResponseBodyContainer>
      {isString(props.actionResponse?.body) &&
      isHtml(props.actionResponse?.body) ? (
        <ReadOnlyEditor folding height={"100%"} input={value} />
      ) : responseTabs && responseTabs.length > 0 && selectedTabIndex !== -1 ? (
        <SegmentedControlContainer>
          <Flex>
            <SegmentedControl
              data-testid="t--response-tab-segmented-control"
              defaultValue={segmentedControlOptions[0]?.value}
              isFullWidth={false}
              onChange={onChange}
              options={segmentedControlOptions}
              value={selectedControl}
            />
          </Flex>
          <ResponseFormatTabs
            data={
              props.actionResponse?.body as string | Record<string, unknown>[]
            }
            responseType={selectedControl || segmentedControlOptions[0]?.value}
            tableBodyHeight={props.responseTabHeight}
          />
        </SegmentedControlContainer>
      ) : null}
    </ResponseBodyContainer>
  );
}

export default ApiFormatSegmentedResponse;
